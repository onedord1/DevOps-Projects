package utils

import (
    "fmt"
    "os"
    "runtime"
    "strings"
    "time"
)

type LogLevel int

const (
    DEBUG LogLevel = iota
    INFO
    WARN
    ERROR
    FATAL
)

var logLevelNames = []string{"DEBUG", "INFO", "WARN", "ERROR", "FATAL"}

type Logger struct {
    level LogLevel
}

func NewLogger(level string) *Logger {
    l := &Logger{level: INFO}
    
    switch strings.ToUpper(level) {
    case "DEBUG":
        l.level = DEBUG
    case "INFO":
        l.level = INFO
    case "WARN":
        l.level = WARN
    case "ERROR":
        l.level = ERROR
    case "FATAL":
        l.level = FATAL
    }
    
    return l
}

func (l *Logger) log(level LogLevel, message string, args ...interface{}) {
    if level < l.level {
        return
    }
    
    _, file, line, _ := runtime.Caller(2)
    fileName := file[strings.LastIndex(file, "/")+1:]
    
    timestamp := time.Now().Format("2006-01-02 15:04:05")
    levelName := logLevelNames[level]
    
    logMessage := fmt.Sprintf("[%s] %s %s:%d - %s", 
        timestamp, levelName, fileName, line, fmt.Sprintf(message, args...))
    
    if level >= ERROR {
        fmt.Fprintln(os.Stderr, logMessage)
    } else {
        fmt.Println(logMessage)
    }
    
    if level == FATAL {
        os.Exit(1)
    }
}

func (l *Logger) Debug(message string, args ...interface{}) {
    l.log(DEBUG, message, args...)
}

func (l *Logger) Info(message string, args ...interface{}) {
    l.log(INFO, message, args...)
}

func (l *Logger) Warn(message string, args ...interface{}) {
    l.log(WARN, message, args...)
}

func (l *Logger) Error(message string, args ...interface{}) {
    l.log(ERROR, message, args...)
}

func (l *Logger) Fatal(message string, args ...interface{}) {
    l.log(FATAL, message, args...)
}

var AppLogger = NewLogger(os.Getenv("LOG_LEVEL"))