@echo off
setlocal EnableDelayedExpansion
set "PKG=%~dp0"
set "CENTRAL=%PKG%central"

set /p RIG_ID=Rig ID [AHWR-50-6]: 
if "%RIG_ID%"=="" set "RIG_ID=AHWR-50-6"

set /p WELL_NAME=Well name: 
if "%WELL_NAME%"=="" (
  echo ERROR: Well name is required.
  pause
  exit /b 1
)

set /p FIELD=Field [ANKLESHWAR]: 
if "%FIELD%"=="" set "FIELD=ANKLESHWAR"

set /p OPERATOR=Operator [ONGC]: 
if "%OPERATOR%"=="" set "OPERATOR=ONGC"

set /p SERVICE=Service Type [Well Service]: 
if "%SERVICE%"=="" set "SERVICE=Well Service"

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop is not installed or not running.
  pause
  exit /b 1
)

cd /d "%CENTRAL%"

echo.
echo Setting active well on central:
echo   Rig:  %RIG_ID%
echo   Well: %WELL_NAME%
echo.

docker compose exec -T crmf-backend node -e "const {pool}=require('./lib/db'); const rig=process.env.RIG_ID, well=process.env.WELL_NAME, field=process.env.FIELD, operator=process.env.OPERATOR, service=process.env.SERVICE; (async()=>{const c=await pool.connect(); try{await c.query('BEGIN'); await c.query('INSERT INTO wells (well_id,name,status,field,operator,service_type,current_rig_id,well_type) VALUES ($1,$1,$2,$3,$4,$5,$6,$7) ON CONFLICT (well_id) DO UPDATE SET name=EXCLUDED.name,status=EXCLUDED.status,field=COALESCE(EXCLUDED.field,wells.field),operator=COALESCE(EXCLUDED.operator,wells.operator),service_type=COALESCE(EXCLUDED.service_type,wells.service_type),current_rig_id=EXCLUDED.current_rig_id,updated_at=now()', [well,'active',field,operator,service,rig,'workover']); await c.query('UPDATE wells SET current_rig_id=NULL, updated_at=now() WHERE current_rig_id=$1 AND well_id<>$2',[rig,well]); const open=(await c.query('SELECT id,well_id FROM well_runs WHERE rig_id=$1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',[rig])).rows[0]; if(open && open.well_id!==well) await c.query('UPDATE well_runs SET ended_at=now() WHERE id=$1',[open.id]); if(!open || open.well_id!==well) await c.query('INSERT INTO well_runs (well_id,rig_id,job_no,service,started_by,started_at) VALUES ($1,$2,$3,$4,$5,now())',[well,rig,well,service,'manual']); await c.query('UPDATE rigs SET active_job=$2, active_activity=COALESCE(active_activity,$3), updated_at=now() WHERE rig_id=$1',[rig,well,'well.started']); await c.query('COMMIT'); console.log('active well set');}catch(e){await c.query('ROLLBACK').catch(()=>{}); console.error(e); process.exit(1);} finally{c.release(); await pool.end();}})();" 
if errorlevel 1 (
  echo ERROR: Could not set active well.
  pause
  exit /b 1
)

docker compose up -d crmf-backend crmf-frontend

echo.
echo DONE. Refresh central with Ctrl+F5.
pause
