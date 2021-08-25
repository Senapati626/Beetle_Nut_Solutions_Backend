const express = require('express');
const mysql = require('mysql');
const cors = require('cors');


const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(cors()); // Used to remove cors error.
app.use(express.json())

//Storing mysql database inside the 'databass' variable;
const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "beetle_nut"
});

//Connecting the database with my server.js
database.connect((err)=>{
    if(err){
        throw err
    }
    console.log("connected to database beetle_nut.");
})

app.get('/',(req,res)=>{
    res.send('BeatleNuts are online.')
})

//Post request showing all branches from the beetle_nut table which matches the pin code inputted by user.
app.post('/shows',(req,res)=>{
    const pin = '%'+req.body.pin+'%';
    database.query(`SELECT * FROM beetle_nut WHERE Pincode_covered like ?`,pin,(err,result)=>{
        if(err) throw err
        res.send(result)
    });
})

// Post request to insert client details inside the alerts.
app.post('/insert',(req,res)=>{
    const pin = '%'+req.body.pin+'%';
    const name = req.body.name;
    const email = req.body.email;
    const users = [];
    database.query(`SELECT username FROM beetle_nut WHERE Pincode_covered like ?`,pin,(err,result)=>{
        if(err) console.log(err);
        for(let i=0;i<result.length;i++){
            users.push(String(result[i].username))
        }
        if(users.length===0){
            database.query(`INSERT INTO alerts(client,client_email,branch_pin,date) VALUES(?,?,?,CURRENT_TIMESTAMP);`,[name,email,req.body.pin],(err,result)=>{
                if(err) throw err;
            })
        }
        users.forEach(ele=>{
            database.query(`INSERT INTO alerts(branch_id,client,client_email,branch_pin,date,branch_username) VALUES((SELECT id FROM beetle_nut WHERE username=?),?,?,?,CURRENT_TIMESTAMP,(SELECT username FROM beetle_nut WHERE username=?));`,[ele,name,email,req.body.pin,ele],(err,result)=>{
                if(err) throw err;
            })
        })
    })
})

// Post request for branch sign in.
app.post('/signin',(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    //console.log(req.body)
    if(!username || !password){
        return res.status(400).json('Cannot Log In');
    }
    database.query(`SELECT * FROM beetle_nut WHERE username=? AND password=?`,[username,password],(err,result)=>{
        if(err) throw err
        res.send(result)
    })
})

// Post request for displaying alerts within a branch.
app.post('/alerts',(req,res)=>{
    const username = req.body.username;
    database.query(`SELECT * FROM alerts WHERE branch_username=? ORDER BY date DESC`,username,(err,result)=>{
        if (err) throw err;
        res.send(result)
    })
})

// Post request for counting the number of alerts for a particular branch.
app.post('/count',(req,res)=>{
    const username = String(req.body.username);
    database.query(`SELECT COUNT(*) AS count FROM alerts WHERE branch_username=?`,username,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

// Post request for showing details of a branch.
app.post('/details',(req,res)=>{
    const username = String(req.body.username);
    database.query(`SELECT * FROM beetle_nut WHERE username=?`,username,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

//Post request for the admin who is shown all alerts.
app.get('/admin',(req,res)=>{
    database.query(`SELECT * FROM alerts ORDER BY date DESC`,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})
server.listen(3001, () => {
    console.log('app is running on port 3001')
})

// The socket.io connection
io.on('connection',(socket)=>{
    //console.log('user connected: '+socket.id)
    socket.on('alert',(data)=>{
        socket.broadcast.emit('alert',data)
    })
})