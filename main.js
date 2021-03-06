const electron = require('electron');
const ipc = electron.ipcMain;//用于接收命令的ipc模块
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;//引入一个BrowserWindow
const path = require('path');
const url = require('url');//引入url处理模块
const autoUpdater = require('electron-updater').autoUpdater;
const {ipcMain,Tray} = require('electron');
const dialog = require('electron').dialog;
const Menu = electron.Menu;//引入菜单慕课
const debug = (process.argv.indexOf('--debug')>0);
let appTray = null;//托盘变量
let trayIcon = path.join(__dirname, 'public//img/tray/');
let message={
    appName:'有思浏览器',
    error:'检查更新出错, 请联系开发人员',
    checking:'正在检查更新……',
    updateAva:'检测到新版本，正在下载……',
    updateNotAva:'现在使用的就是最新版本，不用更新',
    downloaded: '最新版本已下载，点击安装进行更新'
};
let trayMenuTemplate = [//托盘菜单
    {
        label: '退出',
        click: function () {
            CampusWindow.webContents.send('quit');
            CampusWindow.close();
        }
    }
];
let CampusWindow,mainWindow,BrowserHistory,BrowserFeedback,AboutUsW;
try {
    let flash=app.getPath('pepperFlashSystemPlugin');
    app.commandLine.appendSwitch('ppapi-flash-path',flash);
}catch (e) {
    dialog.showErrorBox('缺少flash插件', '请前往https://www.flash.cn/下载该插件,点击确定后将打开flash下载地址');
    process.argv[1]='https://www.flash.cn/';
}
var version=require(__dirname+"/package.json").version;
let WinReg = require('winreg');
let startOnBoot = {
    enableAutoStart: function (name, file, callback) {
        let key = getKey();
        key.set(name, WinReg.REG_SZ, file, callback || noop)
    },
    disableAutoStart: function (name, callback) {
        let key = getKey();
        key.remove(name, callback || noop)
    },
    getAutoStartValue: function (name, callback) {
        let key = getKey();
        key.get(name, function (error, result) {
            if (result) {
                callback(null, result.value)
            } else {
                callback(error)
            }
        })
    }
};

let RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function getKey() {
    return new WinReg({
        hive: WinReg.HKCU, // CurrentUser,
        key: RUN_LOCATION
    })
}
function noop() {
}
function createIndexWindow(flag) {
    if(CampusWindow){
        CampusWindow.show();
        CampusWindow.restore();
        CampusWindow.focus();
        return
    }
    appTray = new Tray(path.join(trayIcon, 'logo1.ico'));
    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('校园资讯');
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);
    appTray.on("click", function(){
        CampusWindow.isVisible() ? CampusWindow.hide() : CampusWindow.show();
    });
    CampusWindow = new BrowserWindow({ width: 750, height: 540, maxWidth: 750, maxHeight: 540,resizable:false,frame: false,icon:path.join(trayIcon, 'logo1.png') });
    CampusWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    CampusWindow.on('closed', function () {
        CampusWindow = null;
        appTray.destroy();
    });
    if(!flag) {
        CampusWindow.hide();
    }
    if(!flag) {
        setTimeout(function () {
            if (CampusWindow) {
                CampusWindow.show();
                CampusWindow.restore();
                CampusWindow.focus();
                setTimeout(function () {
                    if (CampusWindow) {
                        CampusWindow.show();
                        CampusWindow.restore();
                        CampusWindow.focus();
                    }
                }, 1000 * 60*60);
            }
        }, 1000 * 60*5);
        return false;
    }
}
autoUpdater.setFeedURL('http://client.1473.cn/update');//设置检查更新的 url，并且初始化自动更新。这个 url 一旦设置就无法更改。
function createWindow(request_url) {
    mainWindow = new BrowserWindow({//游览器窗口
        width: 1920,
        height: 1080,
        backgroundColor:'#fff',
        webPreferences:{
            'plugins': true
        },
        frame: false
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'browser.html'),
        protocol: 'file:',
        slashes: true
    }));
    if(debug) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () {
        mainWindow = null
    });
    mainWindow.webContents.on('did-finish-load', function(){
        if(request_url) {
            mainWindow.webContents.send('flag', '1');
            mainWindow.webContents.send('url', request_url)
        }else {
            mainWindow.webContents.send('flag', '-1');
        }
    });
    mainWindow.focus();
    mainWindow.on('maximize',function () {
        mainWindow.webContents.send('size', 1);
    });
    mainWindow.on('unmaximize',function () {
        mainWindow.webContents.send('size', -1);
    });
}
function CreateHistory() {
    if(BrowserHistory){
        BrowserHistory.show();
        return false;
    }
    BrowserHistory = new BrowserWindow({//历史记录
        width: 1450,
        height:900,
        resizable:false,
        frame: false,
        parent:mainWindow
    });
    BrowserHistory.loadURL(url.format({
        pathname: path.join(__dirname, 'history.html'),
        protocol: 'file:',
        slashes: true
    }));
    BrowserHistory.on('closed', function () {
        BrowserHistory = null
    });
}
function createFeedBack(){
    if(BrowserFeedback){
        BrowserFeedback.show();
        return false;
    }
    BrowserFeedback = new BrowserWindow({
        width: 500,
        height:320,
        frame:false,
        modal  :true,
        resizable: false,
        maximizable:false,
        minimizable:false,
        parent:mainWindow
    });
    BrowserFeedback.loadURL(url.format({
        pathname: path.join(__dirname, 'feedback.html'),
        protocol: 'file:',
        slashes: true
    }));
    BrowserFeedback.on('closed', function () {
        BrowserFeedback = null
    });
}
function CreateAboutUs() {
    AboutUsW = new BrowserWindow({
        width: 500,
        height:280,
        frame:false,
        modal  :true,
        resizable: false,
        maximizable:false,
        minimizable:false,
        show:false,
        parent:mainWindow
    });
    AboutUsW.loadURL(url.format({
        pathname: path.join(__dirname, 'about.html'),
        protocol: 'file:',
        slashes: true
    }));
    AboutUsW.on('closed', function () {
        AboutUsW = null
    });
}
function CheckUpdate(event) {
    //当开始检查更新的时候触发
    autoUpdater.on('checking-for-update', function() {
        event.sender.send('check-for-update',message.checking);//返回一条信息
    });
    //当发现一个可用更新的时候触发，更新包下载会自动开始
    autoUpdater.on('update-available', function(info) {
        AboutUsW.show();
        event.sender.send('update-down-success', info);
        event.sender.send('check-for-update',message.updateAva);//返回一条信息
    });
    //当没有可用更新的时候触发
    autoUpdater.on('update-not-available', function(info) {
        event.sender.send('check-for-update',message.updateNotAva);//返回一条信息
    });
    autoUpdater.on('error', function(error){
        event.sender.send('check-for-update',message.error);//返回一条信息
    });
    // 更新下载进度事件
    autoUpdater.on('download-progress', function(progressObj) {
        //这个事件无法使用
        mainWindow.webContents.send('download-progress',progressObj)
    });
    autoUpdater.on('update-downloaded',  function () {
        event.sender.send('check-for-update',message.downloaded);//返回一条信息
        //通过main进程发送事件给renderer进程，提示更新信息
    });
    //执行自动更新检查
}
function BindIpc(){
    ipc.on('window-min', function () {
        CampusWindow.minimize();
    });
    ipc.on('window-max', function () {
        if (CampusWindow.isMaximized()) {
            CampusWindow.restore();
        } else {
            CampusWindow.maximize();
        }
    });
    ipc.on('window-close', function () {
        CampusWindow.hide();
    });
    /*校园资讯打开浏览器*/
    ipcMain.on('open-browers',function (e,arg) {
        if(mainWindow){
            mainWindow.webContents.send('url', arg);
            mainWindow.show();
            mainWindow.focus();
            return
        }
        createWindow(arg)
    });
    /*浏览器ipc*/
    ipc.on('newBrowersWindow',function (e,arg) {
        createWindow(arg);
    });
    ipc.on('CampusInfo',function () {
        createIndexWindow(true);
    });
    ipc.on('elm',function (e,arg){
        mainWindow.webContents.send('elm', arg);
    });
    /*反馈窗口ipc*/
    ipc.on('BrowserFeedback-show', function () {
        createFeedBack();
    });
    ipc.on('BrowserFeedback-close', function () {//隐藏
        BrowserFeedback.hide();
        BrowserFeedback.close();
        BrowserFeedback=null;
    });
    /*历史记录ipc*/
    ipc.on('BrowserHistory-show', function () {//显示
        CreateHistory();
    });
    ipc.on('BrowserHistory-close', function () {//隐藏
        BrowserHistory.hide();
        BrowserHistory.close();
        BrowserHistory = null
    });
    /*关于我们IPC*/
    ipc.on('AboutUsW-show', function () {//显示
        AboutUsW.show();
    });
    ipc.on('AboutUsW-close', function () {//隐藏
        AboutUsW.hide();
    });
    /*关于我们获取版本信息*/
    ipcMain.on('get-version',function (event,arg) {
        event.sender.send('version',version);
    });
    /*接收打开历史记录*/
    ipc.on('open-history', function (event,arg) {//隐藏
        mainWindow.webContents.send('open-history', arg)
    });
    /*检查更新*/
    ipc.on('check-for-update', function(event, arg) {
        CheckUpdate(event);
        autoUpdater.checkForUpdates();
    });
    ipc.on('update', function(event, arg) {
        autoUpdater.quitAndInstall();
    });
    ipc.on('openlove', function (event, arg) {
        let request_url = arg
        mainWindow = new BrowserWindow({//游览器窗口
            width: 1920,
            height: 1080,
            backgroundColor:'#fff',
            webPreferences:{
                'plugins': true
            },
            frame: false
        });
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'browser.html'),
            protocol: 'file:',
            slashes: true
        }));
        if(debug) {
            mainWindow.webContents.openDevTools();
        }
        mainWindow.on('closed', function () {
            mainWindow = null
        });
        mainWindow.webContents.on('did-finish-load', function(){
            if(request_url) {
                mainWindow.webContents.send('flag', '1');
                mainWindow.webContents.send('url', request_url)
            }else {
                mainWindow.webContents.send('flag', '-1');
            }
        });
        mainWindow.focus();
        mainWindow.on('maximize',function () {
            mainWindow.webContents.send('size', 1);
        });
        mainWindow.on('unmaximize',function () {
            mainWindow.webContents.send('size', -1);
        });
    })
}

const gotTheLock = app.makeSingleInstance((commandLine, workingDirectory) => {
    createWindow();
});
if (gotTheLock) {

    app.quit();
    return;
}
app.on('ready', () => {
    startOnBoot.enableAutoStart('有思浏览器', process.execPath+" start");
    BindIpc();//ipc通信绑定
    createWindow();
    CreateAboutUs();
    if(process.argv[1]==='start'){
        mainWindow.hide();
        createIndexWindow(false);
    }else{
        if(process.argv[1]&&process.argv[1].indexOf('--')<0) {
            return createWindow(process.argv[1]);
        }
        mainWindow.show();
    }
});
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', function () {
    if (CampusWindow === null&&process.argv[1]==='browers') {
        createIndexWindow(true)
    }
});