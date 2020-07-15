const   passport = require('passport'),
        mysql = require('./mysql_config'),
        LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
    //console.log('serialize run');
    done(null, user.Username);
});

passport.deserializeUser(function(username, done) {
    //console.log('deserialize run');
    mysql.connect('SELECT * FROM users WHERE username="'+username+'";')
    .then((users)=>{
        if(users.rows.length>=0){
            delete users.rows[0].Password;
            let user = {
                username: users.rows[0].Username,
                customerNo: users.rows[0]['CustomerNo.'],
                staffNo: users.rows[0]['StaffNo.']
            }
            //console.log('login 2 success!-->',user);
            return done(null, user);
        }
    })
    .catch((err)=>{
        return done(err, undefined);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        //console.log('strategy run', username, password);
        mysql.connect('SELECT * FROM users WHERE username="'+username+'";')
        .then((users)=>{
            if(users.rows.length <= 0){
                return done(null, false);
            }
            if(users.rows[0].Password != password){
                //console.log(users.rows[0], password);
                return done(null, false);
            }
            delete users.rows[0].Password;
            //console.log('login 1 success!-->',users.rows[0]);
            return done(null, users.rows[0]);
        })
        .catch((err)=>{
            console.log('error',err);
        });
    }
));

module.exports = passport;