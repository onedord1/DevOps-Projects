curl -k "http://localhost:7070/debug/pprof/heap?gc=1" -o stress_before.pprof
end_time=$(($(date +%s) + 300))
while [ $(date +%s) -lt $end_time ]; do
    for i in {1..50}; do
        curl -s http://localhost:7070/health > /dev/null &
    done
    wait
    sleep 1
done

curl -k "http://localhost:7070/debug/pprof/heap?gc=1" -o stress_after.pprof
go tool pprof -diff_base=stress_before.pprof stress_after.pprof