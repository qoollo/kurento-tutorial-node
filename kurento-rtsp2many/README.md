# Kurento Hub

## Development

- install [node.js](https://nodejs.org/)
- update npm to version 3 or later.
```shell
$ cd /c/Program\ Files\ \(x86\)\nodejs
$ npm install npm@3.3.7
```
- install Visual Studio 2015
- install [Node.js Tools for Visual Studio](https://www.visualstudio.com/features/node-js-vs)
- install crossbar (see **Production** installation instructions)
- deploy MongoDb (see **Deployment of MongoDb**)



## Production

- install [Crossbar](http://crossbar.io/):
  - install [node.js](https://nodejs.org/)
  - install [python](https://www.python.org/downloads/) - any version will do (I mean either 2.7.9+ or 3+, these are different branches)
  - verify pip is installed. It may be at *"C:\Python34\Scripts\pip.exe"* or *"C:\Python27\Scripts\pip.exe"* or guess where else.
  - install [pywin](http://sourceforge.net/projects/pywin32/files/pywin32/) - choose version that suites your python version and bitness.
  - install crossbar. It will appear near pip.exe.
```shell 
$ pip install crossbar
```
  - deploy MongoDb (see **Deployment of MongoDb**)



## Deployment of MongoDb

- install MongoDb (https://www.mongodb.org/)
- launch **with administrator rights**: ./mongo installer/mongoInitializer.bat