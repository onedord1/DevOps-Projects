package utils

import (
    "os"
    "time"

    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

// InitLogger initializes the global logger
func InitLogger() {
    // Configure encoder for JSON output (Elasticsearch friendly)
    encoderConfig := zapcore.EncoderConfig{
        TimeKey:        "time",
        LevelKey:       "level",
        NameKey:        "logger",
        CallerKey:      "caller",
        FunctionKey:    zapcore.OmitKey,
        MessageKey:     "msg",
        StacktraceKey:  "stacktrace",
        LineEnding:     zapcore.DefaultLineEnding,
        EncodeLevel:    zapcore.LowercaseLevelEncoder,
        EncodeTime:     customTimeEncoder,
        EncodeDuration: zapcore.SecondsDurationEncoder,
        EncodeCaller:   zapcore.ShortCallerEncoder,
    }

    // Set log level based on environment
    logLevel := zapcore.InfoLevel
    switch os.Getenv("LOG_LEVEL") {
    case "DEBUG":
        logLevel = zapcore.DebugLevel
    case "INFO":
        logLevel = zapcore.InfoLevel
    case "WARN":
        logLevel = zapcore.WarnLevel
    case "ERROR":
        logLevel = zapcore.ErrorLevel
    case "FATAL":
        logLevel = zapcore.FatalLevel
    }

    // Create atomic level
    atomicLevel := zap.NewAtomicLevel()
    atomicLevel.SetLevel(logLevel)

    // Create core
    core := zapcore.NewCore(
        zapcore.NewJSONEncoder(encoderConfig),
        zapcore.AddSync(os.Stdout),
        atomicLevel,
    )

    // Create logger
    Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
    
    // Replace global logger
    zap.ReplaceGlobals(Logger)
}

func customTimeEncoder(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
    enc.AppendString(t.Format("2006-01-02 15:04:05.000"))
}

// Convenience functions for logging
func Info(message string, fields ...zap.Field) {
    Logger.Info(message, fields...)
}

func Debug(message string, fields ...zap.Field) {
    Logger.Debug(message, fields...)
}

func Warn(message string, fields ...zap.Field) {
    Logger.Warn(message, fields...)
}

func Err(message string, fields ...zap.Field) {
    Logger.Error(message, fields...)
}

func Fatal(message string, fields ...zap.Field) {
    Logger.Fatal(message, fields...)
}

// Field helpers for structured logging
func String(key, val string) zap.Field {
    return zap.String(key, val)
}

func Int(key string, val int) zap.Field {
    return zap.Int(key, val)
}

func Int64(key string, val int64) zap.Field {
    return zap.Int64(key, val)
}

func Float64(key string, val float64) zap.Field {
    return zap.Float64(key, val)
}

func Bool(key string, val bool) zap.Field {
    return zap.Bool(key, val)
}

func ErrField(err error) zap.Field {
    return zap.Error(err)
}

func Any(key string, val interface{}) zap.Field {
    return zap.Any(key, val)
}

// Deprecated: Keep for backward compatibility
var AppLogger = Logger