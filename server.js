const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');

app.listen(8129);

function handler (req, res) {
  fs.readFile(__dirname + '/public/socket_server.html',
  (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading socket_serverhtml');
    }

    res.writeHead(200);
    res.end(data);
  });
}

dashboard_device = {}
camera_devices = {}
io.of('camera').on('connection',function(socket){
  var id = socket.id;
  if(!(id in camera_devices)){
    camera_devices[id] = {
      'ip': socket.request.connection.remoteAddress,
      'user-agent': socket.request.headers['user-agent'],
      'status': 'ready'
    }
    io.of('dashboard').emit('receive_camera', camera_devices);
  }
  socket.on('disconnect',function(){
    if(id in camera_devices){
      delete camera_devices[id]
    }
    io.of('dashboard').emit('receive_camera', camera_devices);
  });
  socket.on('capture',function(image_object){
    image_object['camera_id'] = socket.id
    io.of('dashboard').to(image_object['requester_id']).emit('receive_image',image_object)
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
})