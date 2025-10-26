use anyhow::Result;
use redis::{aio::ConnectionManager, AsyncCommands, Client};
use serde::{Deserialize, Serialize};

pub struct RedisClient {
    client: Client,
}

impl RedisClient {
    pub fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        Ok(Self { client })
    }

    pub async fn get_connection(&self) -> Result<ConnectionManager> {
        let manager = ConnectionManager::new(self.client.clone()).await?;
        Ok(manager)
    }

    pub async fn publish<T: Serialize>(&self, channel: &str, message: &T) -> Result<()> {
        let mut conn = self.get_connection().await?;
        let payload = serde_json::to_string(message)?;
        conn.publish::<_, _, ()>(channel, payload).await?;
        Ok(())
    }

    pub async fn set_with_expiry<T: Serialize>(
        &self,
        key: &str,
        value: &T,
        expiry_seconds: u64,
    ) -> Result<()> {
        let mut conn = self.get_connection().await?;
        let payload = serde_json::to_string(value)?;
        conn.set_ex::<_, _, ()>(key, payload, expiry_seconds).await?;
        Ok(())
    }

    pub async fn get<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Result<Option<T>> {
        let mut conn = self.get_connection().await?;
        let value: Option<String> = conn.get(key).await?;
        match value {
            Some(v) => {
                let parsed: T = serde_json::from_str(&v)?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    pub async fn delete(&self, key: &str) -> Result<()> {
        let mut conn = self.get_connection().await?;
        conn.del::<_, ()>(key).await?;
        Ok(())
    }
}

pub struct RedisPubSub {
    client: Client,
}

impl RedisPubSub {
    pub fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url)?;
        Ok(Self { client })
    }

    pub async fn subscribe(&self, channels: &[&str]) -> Result<redis::aio::PubSub> {
        let mut pubsub = self.client.get_async_pubsub().await?;
        for channel in channels {
            pubsub.subscribe(channel).await?;
        }
        Ok(pubsub)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Redis
    async fn test_redis_operations() {
        let redis_url = std::env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());
        
        let client = RedisClient::new(&redis_url).unwrap();
        
        // Test set and get
        client.set_with_expiry("test_key", &"test_value", 60).await.unwrap();
        let value: Option<String> = client.get("test_key").await.unwrap();
        assert_eq!(value, Some("test_value".to_string()));
        
        // Test delete
        client.delete("test_key").await.unwrap();
        let value: Option<String> = client.get("test_key").await.unwrap();
        assert_eq!(value, None);
    }
}
