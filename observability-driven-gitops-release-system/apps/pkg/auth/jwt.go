// Package auth implements lightweight, modern authentication for the platform.
//
// Tokens are JWTs signed with EdDSA (Ed25519) — an asymmetric scheme, so the
// issuer (the frontend BFF) holds the private key while every other service
// only needs the public key to verify. This avoids a shared secret and means a
// compromised verifier cannot mint tokens. See ADR-0006.
//
// For the local/demo inner loop, all services derive the same key pair from a
// shared 32-byte seed (AUTH_SEED) so verification works out of the box. In a
// real deployment the public key is distributed via the issuer's JWKS endpoint
// (/.well-known/jwks.json) and AUTH_SEED is replaced by a managed private key /
// OIDC provider.
package auth

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/acme-commerce/platform/pkg/config"
	"github.com/golang-jwt/jwt/v5"
)

// devSeed is a clearly-insecure default so the demo runs without configuration.
// NEVER use this outside local development; override AUTH_SEED in any real env.
const devSeed = "0000000000000000000000000000000000000000000000000000000000000001"

// Claims is the platform's JWT claim set.
type Claims struct {
	jwt.RegisteredClaims
	Roles []string `json:"roles,omitempty"`
}

// keyMaterial holds a derived Ed25519 key pair plus its key id.
type keyMaterial struct {
	priv ed25519.PrivateKey
	pub  ed25519.PublicKey
	kid  string
}

func deriveKeys() (keyMaterial, error) {
	seedHex := config.String("AUTH_SEED", devSeed)
	seed, err := hex.DecodeString(seedHex)
	if err != nil || len(seed) != ed25519.SeedSize {
		return keyMaterial{}, fmt.Errorf("AUTH_SEED must be %d hex-encoded bytes", ed25519.SeedSize)
	}
	priv := ed25519.NewKeyFromSeed(seed)
	pub := priv.Public().(ed25519.PublicKey)
	return keyMaterial{priv: priv, pub: pub, kid: keyID(pub)}, nil
}

// keyID is a stable identifier derived from the public key.
func keyID(pub ed25519.PublicKey) string {
	sum := sha256.Sum256(pub)
	return base64.RawURLEncoding.EncodeToString(sum[:8])
}

// Issuer mints signed tokens. Only the frontend BFF uses it.
type Issuer struct {
	km       keyMaterial
	issuer   string
	audience string
	ttl      time.Duration
}

// NewIssuer builds an Issuer from the environment.
func NewIssuer() (*Issuer, error) {
	km, err := deriveKeys()
	if err != nil {
		return nil, err
	}
	return &Issuer{
		km:       km,
		issuer:   config.String("AUTH_ISSUER", "acme-frontend"),
		audience: config.String("AUTH_AUDIENCE", "acme-platform"),
		ttl:      config.Duration("AUTH_TOKEN_TTL", time.Hour),
	}, nil
}

// Mint returns a signed JWT for the subject with the given roles.
func (i *Issuer) Mint(subject string, roles ...string) (string, error) {
	now := time.Now()
	jti := make([]byte, 16)
	if _, err := rand.Read(jti); err != nil {
		return "", err
	}
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    i.issuer,
			Subject:   subject,
			Audience:  jwt.ClaimStrings{i.audience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(i.ttl)),
			ID:        hex.EncodeToString(jti),
		},
		Roles: roles,
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	tok.Header["kid"] = i.km.kid
	return tok.SignedString(i.km.priv)
}

// JWKS returns the public key as a JWK Set (RFC 7517) for OKP/Ed25519.
func (i *Issuer) JWKS() map[string]any {
	return map[string]any{
		"keys": []map[string]any{{
			"kty": "OKP",
			"crv": "Ed25519",
			"use": "sig",
			"alg": "EdDSA",
			"kid": i.km.kid,
			"x":   base64.RawURLEncoding.EncodeToString(i.km.pub),
		}},
	}
}

// Verifier validates tokens using only the public key.
type Verifier struct {
	pub      ed25519.PublicKey
	parser   *jwt.Parser
	issuer   string
	audience string
}

// NewVerifier builds a Verifier from the environment.
func NewVerifier() (*Verifier, error) {
	km, err := deriveKeys()
	if err != nil {
		return nil, err
	}
	issuer := config.String("AUTH_ISSUER", "acme-frontend")
	audience := config.String("AUTH_AUDIENCE", "acme-platform")
	return &Verifier{
		pub:      km.pub,
		issuer:   issuer,
		audience: audience,
		parser: jwt.NewParser(
			jwt.WithValidMethods([]string{"EdDSA"}),
			jwt.WithIssuer(issuer),
			jwt.WithAudience(audience),
			jwt.WithExpirationRequired(),
		),
	}, nil
}

// ErrUnauthorized indicates a missing or invalid token.
var ErrUnauthorized = errors.New("unauthorized")

// Verify parses and validates a token string, returning its claims.
func (v *Verifier) Verify(token string) (*Claims, error) {
	claims := &Claims{}
	_, err := v.parser.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		return v.pub, nil
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUnauthorized, err)
	}
	return claims, nil
}
