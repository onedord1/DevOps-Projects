package utils

import (
    "bytes"
    "os"
    "sync"
    "time"

    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

type BufferPool struct {
    pool sync.Pool
}

func NewBufferPool() *BufferPool {
    return &BufferPool{
        pool: sync.Pool{
            New: func() interface{} {
                return new(bytes.Buffer)
            },
        },
    }
}

func (bp *BufferPool) Get() *bytes.Buffer {
    return bp.pool.Get().(*bytes.Buffer)
}

func (bp *BufferPool) Put(buf *bytes.Buffer) {
    if buf.Len() < 1024 { 
        buf.Reset()
        bp.pool.Put(buf)
    }
}

func InitLogger() {
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

    atomicLevel := zap.NewAtomicLevel()
    atomicLevel.SetLevel(logLevel)

    core := zapcore.NewCore(
        zapcore.NewJSONEncoder(encoderConfig),
        zapcore.AddSync(os.Stdout),
        atomicLevel,
    )


    Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
    

    zap.ReplaceGlobals(Logger)
}

func customTimeEncoder(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
    enc.AppendString(t.Format("2006-01-02 15:04:05.000"))
}

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

var AppLogger = Logger