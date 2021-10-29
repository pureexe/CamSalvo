const app = require('http').createServer(handler)
const fs = require('fs');
const config = require('./config.json')
const chalk = require('chalk');
const io = require('socket.io')(app, {cors: {
    origin: "*",
    methods: ["GET", "POST"]
}});
// utility function
function handler (req, res) {
  fs.readFile(
    __dirname + '/public/error.html',
    (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading error.html');
      }
      res.writeHead(200);
      res.end(data);
    }
  );
}
app.listen(config.socket_server.port);
function createClinetConfig(){
  client_config = JSON.parse(JSON.stringify(config)) //deep copy object
  delete client_config['path']; //delete sensitive information
  fs.writeFile(config.path.public + '/config.json',JSON.stringify(client_config),function(err){
    if(err) throw err;
  })
}
createClinetConfig()

// global variable
devices = {
    dashboard: {},
    camera: {},
}


// socket implementation
io.of('dashboard').on('connection', (socket)=>{
    console.log(chalk.cyan('DASHBOARD: ')+chalk.green('CONNECT')+'/'+socket.handshake.address);
    if(!(socket.id in devices["dashboard"])){
        devices['dashboard'][socket.id] = {name: "", address: socket.handshake.address}
        cameras = Object.keys(devices['camera']);
        socket.emit('add_camera', {"devices_camera" : devices.camera})
        cameras.forEach(id=>{
          io.of('camera').to(id).emit('add_dashboard', {"dashboard_ids": [socket.id]});
        })
        socket.on('rtc_answer', data=>{
          console.log(chalk.cyan('DASHBOARD: ')+ ' WEBRTC ' + chalk.magenta("ACCEPT"))
          io.of('camera').to(data['sender']).emit('rtc_answer', data)
        })
        socket.on('disconnect',function(){
            console.log(chalk.cyan('DASHBOARD: ')+chalk.red('DISCONNECT')+'/'+socket.handshake.address);
            if(socket.id in devices['dashboard']){
              delete devices['dashboard'][socket.id]
            }
            io.of('dashboard').emit('remove_dashboard', {"dashboard_ids": [socket.id]});
        });
    }
});
io.of('camera').on('connection', (socket)=>{
    socket.on('set_config',data=>{
      console.log(chalk.yellow('Camera: ') + chalk.green('CONNECT')+'/'+socket.handshake.address+'/'+data['name']);
      camera = {'address': socket.handshake.address}
      Object.keys(data).forEach(k=>{camera[k]=data[k]})
      devices.camera[socket.id] = camera
      cam_info = {}
      cam_info[socket.id] = camera
      io.of('dashboard').emit('add_camera', {"devices_camera" : cam_info});
      socket.emit('add_dashboard', {"dashboard_ids": Object.keys(devices.dashboard)});
    });
    socket.on('rtc_call', data=>{
      console.log(chalk.yellow('Camera: ')+ ' WEBRTC ' + chalk.magenta("CALL"))
      io.of('dashboard').to(data['receiver']).emit('rtc_call', data)
    })
    socket.on('ice_candidate', data=>{
      console.log(chalk.yellow('Camera: ')+ ' WEBRTC ' + chalk.magenta("ICE CANDIDATE"))
      io.of('dashboard').to(data['receiver']).emit('receive_ice_candaite', data)
    })
    socket.on('disconnect',function(){
      if(socket.id in devices['camera']){
        console.log(chalk.yellow('Camera: ') + chalk.red('DISCONNECT')+'/'+socket.handshake.address+'/'+devices['camera'][socket.id]['name']);
        delete devices['camera'][socket.id]
      }
      io.of('camera').emit('remove_camera', {"camera_ids": [socket.id]});
    });
});
/*
function saveImage(filename, base64data){
  setTimeout(function(){ //use non-blocking io
    //base64data = base64data.replace(/^data:image\/jpge;base64,/, "");
    base64data = base64data.split(';base64,').pop()
    fs.writeFile('image.jpg', base64data, {encoding: 'base64'}, function(err) {
      console.log('File created');
    });
  },0); 
}
*/
/*
dashboard_device = {}
camera_devices = {}
io.of('camera').on('connection',function(socket){
  var id = socket.id;
  if(!(id in camera_devices)){
    camera_devices[id] = {
      'ip': socket.request.connection.remoteAddress,
      'user-agent': socket.request.headers['user-agent'],
      'resolution': '800,600',
      'fullres': true,
      'status': 'ready'
    }
    io.of('dashboard').emit('receive_camera', camera_devices);
    camera_info = {'ip': socket.request.connection.remoteAddress}
    socket.emit('camera_infomation',camera_info)
  }
  socket.on('disconnect',function(){
    if(id in camera_devices){
      delete camera_devices[id]
    }
    io.of('dashboard').emit('receive_camera', camera_devices);
  });
  socket.on('capture',function(image_object){
    image_object['camera_id'] = socket.id;
    saveImage("data/image.jpg",image_object['data']);
    if(image_object['requester_id']){
      io.of('dashboard').to(image_object['requester_id']).emit('receive_image',image_object)
    }else{
      io.of('dashboard').emit('receive_image',image_object)
    }
  })
})

io.of('dashboard').on('connect',function(socket){
  socket.emit('receive_camera', camera_devices);
  socket.on('capture',function(camera_id){
    if(camera_id !== undefined && camera_id !== null){
      io.of('camera').to(camera_id).emit('capture',socket.id)
    }else{
      io.of('camera').emit('capture',socket.id)
    }
  })
  socket.on('change_resolution', function(data){
    camera_id = data.camera_id,
    wh = data.resolution.split(',')
    io.of('camera').to(camera_id).emit('video_resolution',{
      width: wh[0],
      height: wh[1]
    })
  })
  socket.on('change_fullres', function(data){
    camera_id = data.camera_id,
    io.of('camera').to(camera_id).emit('change_fullres',data.fullres)
  })
})
*/