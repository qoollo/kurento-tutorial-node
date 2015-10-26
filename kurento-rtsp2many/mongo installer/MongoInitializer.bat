@ECHO OFF

set mongoPath="C:\Program Files\MongoDB\Server\3.0\bin"
set mongoDbPath=C:\MongoDb
set logDir=log
set dbDir=databases
set cfgName=mongod.cfg
set logName=mongo.log

if not exist %mongoDbPath%\%logDir% (
    MD %mongoDbPath%\%logDir%
)

if not exist %mongoDbPath%\%dbDir% (
    MD %mongoDbPath%\%dbDir%
)

set cfg=%mongoDbPath%\%cfgName%

if not exist %cfg% (
    echo logpath=%mongoDbPath%\%logDir%\%logName% >> %cfg%
    echo dbpath=%mongoDbPath%\%dbDir% >> %cfg%
    echo cpu=true >> %cfg%
    echo verbose=true >> %cfg%
    echo nohttpinterface=true >> %cfg%
    echo bind_ip=localhost >> %cfg%
    echo port=27017 >> %cfg%
    echo noauth=true >> %cfg%
)

CD %mongoPath%
mongod --config %cfg% --install
net start MongoDB

Pause