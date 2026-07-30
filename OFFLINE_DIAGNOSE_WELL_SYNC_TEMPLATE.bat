@echo off
setlocal
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"
set "OUT=%PKG%OFFLINE_WELL_SYNC_DIAG.txt"

set "RIG_ID=AHWR-50-6"
if not "%~1"=="" set "RIG_ID=%~1"

echo AHWR Central Well Sync Diagnostic > "%OUT%"
echo Date: %DATE% %TIME% >> "%OUT%"
echo Rig: %RIG_ID% >> "%OUT%"
echo Package: %PKG% >> "%OUT%"
echo. >> "%OUT%"

where docker >> "%OUT%" 2>>&1
echo. >> "%OUT%"

cd /d "%CENTRAL%"

echo ==== docker compose ps ==== >> "%OUT%"
docker compose ps >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== rig active job ==== >> "%OUT%"
docker compose exec -T timescaledb psql -U crmf -d crmf -c "select rig_id, status, active_job, active_activity, last_data_at, last_seq from rigs where rig_id='%RIG_ID%';" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== current wells attached to rig ==== >> "%OUT%"
docker compose exec -T timescaledb psql -U crmf -d crmf -c "select well_id, name, status, service_type, field, operator, current_rig_id, updated_at from wells where current_rig_id='%RIG_ID%' order by updated_at desc;" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== open well runs for rig ==== >> "%OUT%"
docker compose exec -T timescaledb psql -U crmf -d crmf -c "select wr.id, wr.well_id, w.name, wr.job_no, wr.service, wr.started_by, wr.started_at, wr.joints, wr.depth_delta from well_runs wr left join wells w on w.well_id=wr.well_id where wr.rig_id='%RIG_ID%' and wr.ended_at is null order by wr.started_at desc;" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== latest snapshot likely well fields ==== >> "%OUT%"
docker compose exec -T timescaledb psql -U crmf -d crmf -c "select ts, jsonb_pretty(values - '__ts') from rig_latest where rig_id='%RIG_ID%';" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== recent activity/well events ==== >> "%OUT%"
docker compose exec -T timescaledb psql -U crmf -d crmf -c "select ts, type, payload from events where rig_id='%RIG_ID%' and (type like 'well%%' or type='activity') order by ts desc limit 30;" >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo ==== backend logs well/ingest tail ==== >> "%OUT%"
docker compose logs --tail=250 crmf-backend >> "%OUT%" 2>>&1
echo. >> "%OUT%"

echo Diagnostic written to:
echo %OUT%
echo.
echo Send this OFFLINE_WELL_SYNC_DIAG.txt file.
pause
