const mysql = require('mysql');

const config = {
    host     : '85.10.205.173',
    user     : 'boxoffice_admin',
    password : '11121150',
    database : 'db_boxoffice_io'
};

let connection = undefined;

const init_connection = () => {
    connection = mysql.createConnection(config);
    connection.connect((err)=>{
        if(err){
            console.log('Error connecting to db:',err);
            setTimeout(init_connection, 2000);
        }
    });
    connection.on('error', (err)=>{
        console.log('db error ===>',err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST' || 'ETIMEDOUT'){
            init_connection();
        } else{
            throw err;
        }
    });
}

const connect = (query,dataArray = null) => {
    return new Promise(function(resolve, reject){
        connection.query(query,[dataArray], (err, rows, fields)=>{
            if(err) reject(err);
            resolve({
                rows: rows,
                insertId: (typeof rows != 'undefined') ? rows.insertId:undefined,
                fields: fields,
            });
        });
        
    });
}

init_connection();

module.exports = {connect: connect};

// ==== MySQL DB @ db4free.net ====
// host: 85.10.205.173 or db4free.net
// phpMyAdmin: https://www.db4free.net/phpMyAdmin/
// Database: db_boxoffice_io
// Username: boxoffice_admin
// Email: htraexd@gmail.com
// ================================