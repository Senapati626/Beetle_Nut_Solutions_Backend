const express = require('express');
const mysql = require('mysql');
const io = require('socket.io');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json())
const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "beetle_nut"
});

database.connect((err)=>{
    if(err){
        throw err
    }
    console.log("connected to database beetle_nut.");
})

app.get('/',(req,res)=>{
    res.send('BeatleNuts are online.')
})
app.post('/shows',(req,res)=>{
    const pin = '%'+req.body.pin+'%';
    database.query(`SELECT * FROM beetle_nut WHERE Pincode_covered like ?`,pin,(err,result)=>{
        if(err) throw err
        res.send(result)
    });
})
app.post('/insert',(req,res)=>{
    const pin = '%'+req.body.pin+'%';
    const name = req.body.name;
    const email = req.body.email;
    console.log(req.body);
    const users = [];
    database.query(`SELECT username FROM beetle_nut WHERE Pincode_covered like ?`,pin,(err,result)=>{
        if(err) throw err
        for(let i=0;i<result.length;i++){
            users.push(String(result[i].username))
        }
        users.forEach(ele=>{
            database.query(`INSERT INTO alerts(branch_id,client,client_email,branch_username,date) VALUES((SELECT id FROM beetle_nut WHERE username=?),?,?,(SELECT username FROM beetle_nut WHERE username=?),CURRENT_TIMESTAMP);`,[ele,name,email,ele],(err,result)=>{
                if(err) throw err;
            })
        })
    })
})
app.post('/signin',(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    console.log(req.body)
    if(!username || !password){
        return res.status(400).json('Cannot Log In');
    }
    database.query(`SELECT * FROM beetle_nut WHERE username=? AND password=?`,[username,password],(err,result)=>{
        if(err) throw err
        res.send(result)
    })
})
app.post('/alerts',(req,res)=>{
    const username = req.body.username;
    database.query(`SELECT * FROM alerts WHERE branch_username=? ORDER BY date DESC`,username,(err,result)=>{
        if (err) throw err;
        res.send(result)
    })
})
app.post('/count',(req,res)=>{
    const username = String(req.body.username);
    database.query(`SELECT COUNT(*) AS count FROM alerts WHERE branch_username=?`,username,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})
app.post('/details',(req,res)=>{
    const username = String(req.body.username);
    database.query(`SELECT * FROM beetle_nut WHERE username=?`,username,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})
app.get('/admin',(req,res)=>{
    database.query(`SELECT * FROM alerts`,(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})
//INSERT INTO alerts(branch_id,client,client_email,branch_username,date) VALUES((SELECT id FROM beetle_nut WHERE username="teja"),"bebo","bebo@gmail.com",(SELECT username FROM beetle_nut WHERE username="teja"),CURRENT_TIMESTAMP);
app.listen(3001, () => {
    console.log('app is running on port 3001')
})
