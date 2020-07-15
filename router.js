const   express = require('express'),
        router = express.Router(),
        fs = require('fs-extra'),
        uuidv4 = require('uuidv4'),
        mysql = require('./mysql_config'),
        moment = require('moment');
        passport = require('./passport');

function checkAuthentication(req,res,next){
    if(req.isAuthenticated()){
        //req.isAuthenticated() will return true if user is logged in
        next();
    } else{
        res.redirect("/guest");
    }
}

router.all('/', checkAuthentication, (req, res) => {
    let reservationNo = req.query.reservationNo == '' ? undefined:req.query.reservationNo;
    let scheduleNo = req.query.scheduleNo == ''? undefined:req.query.scheduleNo;
    res.render('index', {
            auth: req.user.customerNo != null ? 1 : 2,
            data:{
                reservationSuccess: {
                    reservationNo: reservationNo,
                    scheduleNo: scheduleNo
                }
            }
    });
});

router.all('/guest', (req,res)=>{
    res.render('index', {
        auth: false
    });
});

router.get('/user', checkAuthentication, (req,res)=>{
    if(Object.keys(req.query).length==0){
        res.send(req.user);
    }else{
        let columns = '`'+req.query.columns.join().replace(/,/g,'`,`')+'`';
        if(req.query.columns.includes('*')) columns = '*';
        let table = req.user.customerNo == null ? 'staff' : 'customer';
        let searchField = req.user.customerNo == null ? 'StaffNo' : 'CustomerNo';
        let userNo = req.user.customerNo == null ? req.user.staffNo : req.user.customerNo;
        mysql.connect('SELECT '+columns+' FROM `'+table+'` WHERE `'+searchField+'`='+userNo+';')
        .then((resp)=>{
            if(resp.rows.length <= 0){
                //return
                res.sendStatus(404);
            }
            res.send({...req.user,...resp.rows[0]});
        })
        .catch((err)=>{
            console.log('error',err);
        });
    }
});

router.get('/movies', (req,res)=>{
    let status = req.query.status == '' ? undefined:req.query.status;
    let movieId = req.query.movieId == '' ? undefined:req.query.movieId;
    let columns = undefined;
    let movieDateStart = req.query.dateStart == '' ? undefined:req.query.dateStart;
    let movieDateStop = req.query.dateStop == '' ? undefined:req.query.dateStop;
    if(typeof req.query.columns != 'undefined'){
        columns = req.query.columns.length > 0 ? '`'+req.query.columns.join().replace(/,/g,'`,`')+'`':undefined;
    }
    console.log(movieId)
    console.log(movieId!=undefined)
    let query = 'SELECT'+ (columns?columns:'*') 
                    + 'FROM `movie`' 
                    + (status||movieId ? 'WHERE':'') 
                    + (movieId ? '`MovieNo`='+movieId:'') 
                    + (status&&movieId || movieDateStart&&movieId ? 'AND':'') 
                    + (status=='show' ? '`MovieNo` IN (SELECT `MovieNo` FROM `schedule` WHERE `schedule`.`Date` >= "'+movieDateStart+'" ':' ') 
                    + (movieDateStart&&movieDateStop ? 'AND `schedule`.`Date` <= "'+movieDateStop+'") ':'')
                    + (movieDateStart&&!movieDateStop ? ') ':'')
                    + ';';
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.sendStatus(404);
        }
        console.log('found',resp.rows.length,'movie(s)');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});

router.get('/schedule', (req,res)=>{
    let status = req.query.status == '' ? undefined:req.query.status;
    let movieId = req.query.movieId == '' ? undefined:req.query.movieId;
    let date = req.query.date == '' ? undefined:req.query.date;
    let query = 'SELECT s.*,t.BranchNo,t.PlanName, b.BranchName, b.BranchAddress FROM `schedule` s '
                    + 'JOIN (SELECT * FROM theatre) AS t ON s.TheatreCode = t.TheatreCode '
                    + 'JOIN (SELECT * FROM branch) AS b ON t.BranchNo = b.BranchNo '
                    + 'WHERE `MovieNo`='+movieId+' ';
    if(date){
        query += "AND `Date` >= '"+date+"'";
    }
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.sendStatus(404);
        }
        console.log('found',resp.rows.length,'schedule(s)');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});

router.get('/plan', (req,res)=>{
    let theatreId = req.query.theatreId == '' ? undefined:req.query.theatreId;
    let query = "SELECT p.* FROM `plan` p,`theatre` t "
                    + "WHERE t.TheatreCode = '" + theatreId + "' "
                    + "AND p.PlanName = t.PlanName";
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.sendStatus(404);
            return;
        }
        console.log('found',resp.rows.length,'theatre plan(s)');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});

router.get('/coupon', (req,res)=>{
    console.log('user sent=>',req.query);
    let code = req.query.code == '' ? undefined:req.query.code;
    let query = "SELECT c.*, cm.`MovieNo`, cb.`BranchNo` "
                    + "FROM `coupon` c, `coupon_branch` cb, `coupon_movie` cm "
                    + "WHERE c.`CouponCode` = cb.`CouponCode` "
                    + "AND c.`CouponCode` = cm.`CouponCode` "
                    + "AND c.`CouponCode` = '"+code+"';";
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.status(200).send([]);
            return;
        }
        console.log('found',resp.rows.length,'coupon with code "'+code+'"');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});

router.get('/seatclass', (req,res)=>{
    let classNames = req.query.className == '' ? undefined:req.query.className;
    let query = "SELECT * FROM `seatclass` WHERE "
    let i = 0;
    classNames.forEach((className)=>{
        if(i>0) query += ' OR '
        query += "`ClassName`='"+className+"'";
        i++;
    }) 
    query+=";" 
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.sendStatus(404);
        }
        console.log('found',resp.rows.length,'theatre plan(s)');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});

router.get('/reservation/customer', (req,res) => {
    let targetCustomer = req.query.customerId == '' ? undefined: req.query.customerId;
    if(targetCustomer){
        let query = "SELECT r.*, b.`BranchName`, m.*, s.`TheatreCode`, s.`Date` as PlayDate, s.`Time` as PlayTime, s.`Audio`, s.`Dimension`, s.`Subtitle`, i.`ReservationItem`, i.`SeatClass`, i.`SeatCode` "
                        +"FROM `reservation` r, `reservation_items` i, `movie` m, `schedule` s, `theatre` t, `branch` b "
                        +"WHERE r.`ReservationNo` = i.`ReservationNo` "
                        +"AND s.`ScheduleNo` = r.`ScheduleNo` "
                        +"AND t.`TheatreCode` = s.`TheatreCode` "
                        +"AND b.`BranchNo` = t.`BranchNo` "
                        +"AND m.`MovieNo` = s.`MovieNo` "
                        +"AND r.`CustomerNo` = "+targetCustomer+";";
        mysql.connect(query)
        .then((resp)=>{
            if(resp.rows.length <= 0){
                //return
                console.log('NO RESERVE FOUND')
                res.sendStatus(204);
                return;
            }
            console.log('found',resp.rows.length,'user reservation(s)');
            let byReservation = {}
            let byCreatedDate = {}
            resp.rows.forEach((row)=>{
                if(typeof byReservation[row.ReservationNo] == 'undefined') byReservation[row.ReservationNo] = [];
                byReservation[row.ReservationNo].push(row);
            });
            Object.keys(byReservation).forEach((reservationNo)=>{
                let mon_template = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let date = new Date(byReservation[reservationNo][0].DateCreated);
                date = date.getDate()+'-'+(mon_template[date.getMonth()])+'-'+date.getFullYear();
                if(typeof byCreatedDate[date] == 'undefined') byCreatedDate[date] = [];
                byCreatedDate[date].push(byReservation[reservationNo]);
            });
            res.send(byCreatedDate);
        })
        .catch((err)=>{
            console.log('error',err);
        });
        return;
    }else{
        res.sendStatus(400);
        return;
    }
});

router.get('/reservation/:scheduleNo', (req,res)=>{
    let scheduleNo = req.params.scheduleNo;
    let query = "SELECT i.SeatClass, i.SeatCode, i.SeatRow, i.SeatCol FROM `reservation` r, `reservation_items` i "
                    +"WHERE r.`ReservationNo` = i.`ReservationNo` "
                    +"AND r.`ScheduleNo` = "+scheduleNo+";"
    mysql.connect(query)
    .then((resp)=>{
        if(resp.rows.length <= 0){
            //return
            res.send(null);
            return;
        }
        console.log('found',resp.rows.length,'reservation(s)');
        res.send(resp.rows);
    })
    .catch((err)=>{
        console.log('error',err);
    });
});


router.post('/reservation', checkAuthentication, (req,res)=>{
    let seatList = req.body.seatCode;
    let movieNo = req.body.movieNo;
    let branchNo = req.body.branchNo;
    let customerNo = req.body.customerNo;
    let scheduleNo = req.body.scheduleNo;
    let email = req.body.userEmail;
    let telephone = (typeof req.body.telephone != 'undefined') ? req.body.userTele:undefined;
    let couponCode = undefined;
    if(typeof req.body.coupon != 'undefined') {
        couponCode = (req.body.coupon!='') ? req.body.coupon.toUpperCase():null;
    }
    console.log('coupon', req.body.coupon, couponCode)
    //identify issuer
    let correctUser = req.user.customerNo == req.body.customerNo;

    //initialize reservation
    //console.log(req.body);
    let reservation = {
        MovieNo: movieNo,
        BranchNo: branchNo,
        ReservationKey: undefined,
        CustomerNo: customerNo,
        ScheduleNo: scheduleNo,
        CouponUsage: undefined,
        TicketList: []
    };

    //create reservation
    let query3 = "INSERT INTO `reservation` (`CustomerNo`, `ScheduleNo`, `DateCreated`) "
                    +"VALUES("+reservation.CustomerNo+", "+reservation.ScheduleNo+", CURRENT_TIMESTAMP);";
    
    mysql.connect(query3)
    .then((resp)=>{
        return resp.insertId;
    })
    //Create Reservation Items with reservationKey
    .then((reservationKey)=>{
        //get plan by schedule number
        let query4 = "SELECT p.* FROM `plan` p, `schedule` s, `theatre` t "
                        +"WHERE s.`ScheduleNo` = "+reservation.ScheduleNo+" "
                        +"AND t.`TheatreCode` = s.`TheatreCode` "
                        +"AND p.`PlanName` = t.`PlanName`;"
        return mysql.connect(query4)
        .then((resp)=>{
            if(resp.rows.length > 0){
                return resp.rows[0];
            }
        })
        .then((plan)=>{
            //get price for class
            let query5 = "SELECT * FROM `seatclass` WHERE ";
            for(let i=1;i<=4;i++){
                if(plan['SeatClass'+i]!=null) {
                    if(i>1) query5 += "OR ";
                    query5 += "ClassName = '"+plan['SeatClass'+i]+"' ";
                }
            }
            query5+=';';
            return mysql.connect(query5)
            .then((resp)=>{
                let reservationObj = reservation;
                reservationObj.ReservationKey = reservationKey;
                
                if(resp.rows.length > 0){
                    let classInfo = resp.rows;
                    // seat code to class, row, column
                    console.log('seat List', seatList)
                    seatList.forEach((seatCode, i)=>{
                        // console.log(seatCode);
                        let row = seatCode.match(/[a-zA-Z]+/g)[0].charCodeAt(0)+26*(seatCode.match(/[a-zA-Z]+/g).length-1)-65; //start from 0
                        let classList = [];
                        let priceList = {};
                        for(let i=1;i<=4;i++){
                            if(plan['SeatClass'+i]!=null) classList = [...classList, ...Array.apply(null, Array(plan['NumberRow'+i])).map(function(){return plan['SeatClass'+i]})];
                            if(i <= classInfo.length) priceList[classInfo[i-1].ClassName] = classInfo[i-1].Price;
                        }

                        //reservationObj.reservationKey = reservationKey;
                        reservationObj.TicketList.push({
                            ReservationNo: reservationKey,
                            ReservationItem: i,
                            SeatCode: seatCode,
                            SeatClass: classList[row],
                            SeatRow: row,
                            SeatCol: parseInt(seatCode.match(/\d+/g)[0]),
                            FullPrice: priceList[classList[row]]
                        });
                    });
                    
                    return reservationObj;
                }
                //else throw error invalid seat class
            })
        })
    })
    //INSERT reservation item
    .then((reservations)=>{
        let query6 = "INSERT INTO reservation_items(`ReservationNo`, `ReservationItem`, `SeatCode`, `SeatClass`, `SeatRow`, `SeatCol`) VALUES";
        reservations.TicketList.forEach((item, i)=>{
            if(i>0) query6 += ",";
            query6 += "("+item.ReservationNo+","+item.ReservationItem+",'"+item.SeatCode+"','"+item.SeatClass+"',"+item.SeatRow+","+item.SeatCol+")";
        });
        query6 += ";"
        return mysql.connect(query6)
        .then((resp)=>{
            return {ticketItemResp:resp, reservationKey:reservations.reservationKey, reservationObj: reservations};
        });
    })
    //validate coupon
    .then((resp)=>{
        let reservationObj = resp.reservationObj;
        let query = "SELECT c.*, cm.`MovieNo`, cb.`BranchNo` "
                    + "FROM `coupon` c, `coupon_branch` cb, `coupon_movie` cm "
                    + "WHERE c.`CouponCode` = cb.`CouponCode` "
                    + "AND c.`CouponCode` = cm.`CouponCode` "
                    + "AND c.`CouponCode` = '"+couponCode+"';";
        //validate coupon (if found create coupon usage)
        return mysql.connect(query)
        .then((resp)=>{
            let totalPrice = 0;
            reservationObj.TicketList.forEach((ticket)=>{
                totalPrice+=ticket.FullPrice;
            });

            if(resp.rows.length <= 0 || couponCode==null){
                reservationObj.CouponUsage = null;
                reservationObj.Billing = totalPrice;
                //console.log('billing no coupon',reservationObj.Billing);
                // return null;
            }else{
                //console.log(reservationObj);
                let coupon = resp.rows[0];
                let deduction = totalPrice*coupon.Discount;
                if(coupon.MaxDiscount != 0 && coupon.MaxDiscount != null) deduction = coupon.MaxDiscount;
                if(totalPrice-deduction<0) deduction=totalPrice;
                
                //validate requirement (if not pass return like is null)
                    //check coupon
                    let todayDate = new Date();
                    let expDate = new Date(coupon.EXPDate);
                    let expPass = todayDate < expDate;

                    let spendPass = totalPrice >= coupon.MinSpend;
                    let minSeatPass = reservationObj.TicketList.length >= coupon.MinSeat;
                    let availablePass = coupon.NoAvailable > 0;
                    
                    //create allowing branch and movie data
                    let couponBranchData = [];
                    let couponMovieData = [];
                    resp.rows.forEach((row)=>{
                        if(!couponBranchData.includes(row.BranchNo)){
                            couponBranchData.push(row.BranchNo);
                        }
                        if(!couponMovieData.includes(row.MovieNo)){
                            couponMovieData.push(row.MovieNo);
                        }
                    });
                    console.log('Coupon\'s allowing movies', couponMovieData);
                    console.log('Coupon\'s allowing branches', couponBranchData);
                    //check coupon schedule
                    let branchPass = couponBranchData.includes(parseInt(reservationObj.BranchNo));
                    if(!branchPass) console.log('==> Ticket for branch(',reservationObj.BranchNo,') not satisfy coupon(',coupon.CouponCode,')');
                    //check coupon seatclass
                    let moviePass = couponMovieData.includes(parseInt(reservationObj.MovieNo));
                    if(!moviePass) console.log('==> Ticket for movie(',reservationObj.MovieNo,') not satisfy coupon(',coupon.CouponCode,')');
                    console.log(branchPass, moviePass)
                if(!(expPass && spendPass && minSeatPass && availablePass && branchPass && moviePass)){
                    reservationObj.CouponUsage = null;
                }else{
                    //create coupon usage
                    let query1 = "INSERT INTO `couponusage` (`CouponUsageNo`, `ReservationNo`, `CouponCode`, `Deduction`)"
                                    +"VALUES (NULL, '"+reservationObj.ReservationKey+"', '"+coupon.CouponCode+"', "+deduction+");"
                    return mysql.connect(query1)
                    .then((resp)=>{
                        //read coupon usage no 
                        let couponUsageKey = resp.insertId;
                        reservationObj.CouponUsage = couponUsageKey;
                        reservationObj.Coupon = coupon;
                        reservationObj.Billing = totalPrice - deduction;
                        if(totalPrice-deduction<0) reservationObj.Billing = 0;
                        //console.log('billing',reservationObj.Billing);
                        return reservationObj;
                    });
                }
            }
            return reservationObj;
        })
    })
    //update `Billing` in reservation table && add movie revenue
    .then((reservationObj)=>{
        console.log('res obj on update', reservationObj);
        let query = "UPDATE `reservation` "
                        + "SET `Billing` = " + reservationObj.Billing + " "
                        + "WHERE `ReservationNo` = " + reservationObj.ReservationKey
                        + ";";
        return mysql.connect(query)
        .then((resp)=>{
            let totalPrice = 0;
            reservationObj.TicketList.forEach((ticket)=>{
                totalPrice+=ticket.FullPrice;
            });
            let queryM = "UPDATE `movie_revenue` "
                        + "SET RealRevenue = RealRevenue+" + totalPrice + " "
                        + "WHERE MovieNo = " + reservationObj.MovieNo
            
            return mysql.connect(queryM)
            .then((resp)=>{
                return reservationObj;
            });
        });
    })
    //update coupon's NoAvailable
    .then((reservationObj)=>{
        if(typeof reservationObj.CouponUsage != 'undefined'){
            if(reservationObj.CouponUsage != null){
                let couponCode = reservationObj.Coupon.CouponCode;
                let noAvailable = reservationObj.Coupon.NoAvailable - 1;
                //decrement coupon NoAvailable
                let query2 = "UPDATE `coupon` SET `NoAvailable` = '"+noAvailable.toString(10)+"' "
                                +"WHERE `coupon`.`CouponCode` = '"+couponCode+"';";
                
                return mysql.connect(query2)
                .then((resp)=>{
                    return reservationObj;
                });
            }
        }
        return reservationObj;
    })
    //get ticketing result for user
    .then((ticketObj)=>{
        console.log('ticketing ALL SUCCESS')
        res.status(200).send(ticketObj);
    })
    .catch((err)=>{
        console.log('ticketing ERROR',err);
        res.sendStatus(500);
    });
    //console.log('==========\nTicket(s) Requested:\n('+seatList.length+' seat(s))\n', req.body,'\n==========\n');
});

router.post('/tickets/:ticketId/confirm', (req,res)=>{

});

//=======================


router.post('/fetchData',(req,res)=>{
    console.log(req.body);
    var sql = "SElECT * FROM `"+req.body.table+"`";
    mysql.connect(sql)
        .then((resp)=>{
            res.send(resp.rows);
        });
});

router.get('/fetchData/:table/:condition', (req,res) => {
    //เรียกใช้ด้วย /fetchData/ชื่อตารางที่ต้องการดึงข้อมูล/เงื่อนไข(เช่น PlanName=Branch01 ไม่มีเว้นวรรค)ถ้าไม่มีเงื่อนไขให้ใส่ none
    var sql = "SELECT * FROM `"+req.params.table+"` ",
        condition = req.params.condition.split("=");
    if(condition[0]!="none"){
        sql += "WHERE `"+condition[0]+"` = '"+condition[1]+"'";
    }
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            //console.log(resp);
            res.send(resp.rows);
        });
});

router.get('/fetchDataMovie',(req,res)=>{
    console.log("movieWithSchedule");
    var sql = "SELECT * FROM `movie`, `schedule` where schedule.MovieNo = movie.MovieNo ORDER BY schedule.Date DESC";
    mysql.connect(sql)
        .then((resp)=>{
            res.send(resp.rows);
        });
});


router.post('/seatclass', (req,res) => {
    var data = req.body;
    var use = 0;
    var sql = "INSERT INTO `seatclass` (`ClassName`, `Price`, `Couple`, `FreeFood`, `Width`, `Height`) VALUES";
    //console.log(data);
    //res.send(data);
    data.SeatClassData.forEach((value)=>{
        if(value.Detail){
            if(value.Detail=='Create'){
                sql += "('"+value.ClassName+"','"+ value.Price+"','"+value.Couple+"','"+value.FreeFood+"','"+value.Width+"','"+value.Height+"'),";
                use = 1;
            }
        }
        
    })
    sql = sql.substring(0, sql.length-1);
    if(use){
        mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        });
    }
    else res.sendStatus(200);
});


router.post('/plan/update', (req,res)=>{
    var data = req.body;
    var sql = "UPDATE `plan` SET `PlanName` = '"+data.newName+"' WHERE `plan`.`PlanName` = '"+data.oldName+"'";
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            //console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})

router.get('/plan/delete/:plan',(req,res)=>{
    var sql = "DELETE FROM `plan` WHERE `plan`.`PlanName` = '"+req.params.plan+"'";
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            //console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})

router.post('/plan', (req,res)=>{
    var data = req.body;
    //console.log(data);
    var sql = "INSERT INTO `plan` (`PlanName`, `PlanHeight`, `PlanWidth`, `SeatClass1`, `NumberRow1`, `SeatClass2`, `NumberRow2`, `SeatClass3`, `NumberRow3`, `SeatClass4`, `NumberRow4`) VALUES ('"+
                data.PlanName+"','"+ data.PlanHeight+"','"+data.PlanWidth+"','"+data.SeatClass1+"','"+data.NoRow1+"','"+data.SeatClass2+"','"+data.NoRow2+"','"+data.SeatClass3+"','"+data.NoRow3+"','"+data.SeatClass4+"','"+data.NoRow4+"')ON DUPLICATE KEY UPDATE PlanName=VALUES(PlanName),PlanName=VALUES(PlanName),PlanHeight=VALUES(PlanHeight),PlanWidth=VALUES(PlanWidth),SeatClass1=VALUES(SeatClass1),NumberRow1=VALUES(NumberRow1),SeatClass2=VALUES(SeatClass2),NumberRow2=VALUES(NumberRow2),SeatClass3=VALUES(SeatClass3),NumberRow3=VALUES(NumberRow3),SeatClass4=VALUES(SeatClass4),NumberRow4=VALUES(NumberRow4)";
    sql = sql.replace(/'undefined'/g, 'NULL');
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            var TheatreDelete = [];
            //console.log(resp);
            if(data.Theatre != null){
                var sqlInsert = "INSERT INTO `theatre`(`TheatreCode`, `BranchNo`, `PlanName`) VALUES ",
                sqlDelete = "DELETE FROM `theatre` WHERE `TheatreCode` IN (?)",
                callFunctionSql = [0,0]; //Insert and Update , Delete
                data.Theatre.forEach((value) => {
                    switch(value.Detail.Type){
                        case 'Update' : if(value.Detail.Old != value.Name){ TheatreDelete.push(value.Detail.Old); callFunctionSql[1]=1; } 
                        case 'Create' : sqlInsert += "('"+value.Name+"','"+value.Branch+"','"+data.PlanName+"'),"; callFunctionSql[0]=1; break;
                        case 'Delete' : TheatreDelete.push(value.Detail.Old); callFunctionSql[1]=1; break;
                    }
                });
                sqlInsert = sqlInsert.substring(0, sqlInsert.length-1);
                sqlInsert += "ON DUPLICATE KEY UPDATE TheatreCode=VALUES(TheatreCode), BranchNo=VALUES(BranchNo), PlanName=VALUES(PlanName)";
                callFunctionSql[1] ? sql = sqlDelete : sql = sqlInsert;
                if(callFunctionSql[0]||callFunctionSql[1]){
                    //console.log(sql);
                    mysql.connect(sql,TheatreDelete)
                        .then((resp)=>{
                            if(callFunctionSql[0]&&callFunctionSql[1]){
                                sql = sqlInsert;
                                mysql.connect(sql).then((resp)=>{
                                    //console.log(resp);
                                    res.send(resp);
                                });
                            }
                            else{
                                //console.log(resp);
                                res.send(resp.rows);
                            }
                        });
                }
                else res.send(resp);
            }else res.send(resp);
       });
});

router.post('/register',(req,res)=>{
    var data = req.body;
    var sql = "INSERT INTO `customer`( `FirstName`, `MidName`, `LastName`, `BirthDate`, `Gender`, `CitizenID/PassportID`, `PhoneNumber`, `ImageURL`, `Address`, `Email`) VALUES";
    sql += " ('"+data.Detail.firstname+"','"+data.Detail.midname+"','"+data.Detail.lastname+"','"+data.Detail.birthday+"','"+data.Detail.gender+"','"+data.Detail.C_PId+"','"+data.Detail.phone+"','"+data.Detail.img+"','"+data.Detail.address+"','"+data.Detail.email+"')";
    mysql.connect(sql)
        .then((resp)=>{
            var sql = "INSERT INTO `users`(`Username`, `Password`, `CustomerNo.`, `StaffNo.`) VALUES";
            sql += "('"+data.user.username+"','"+data.user.password+"','"+resp.insertId+"',NULL)";
            console.log(sql);
            mysql.connect(sql)
                .then((resp=>{
                    res.sendStatus(200);
                }))
        })
    console.log(data);
})

router.get('/analysis/:number',(req,res)=>{
    var sql = [
        "SELECT t.BranchName, MIN(t.CusCount) AS min, AVG(t.CusCount) AS avg, MAX(t.CusCount) AS max FROM	(SELECT COUNT(ri.RecordIndex) AS CusCount , sh.MovieNo, b.BranchName FROM `reservation_items`ri, `reservation` r ,  `schedule` sh, `theatre` th, `branch` b  WHERE ri.ReservationNo = r.ReservationNo AND r.ScheduleNo = sh.ScheduleNo AND sh.TheatreCode = th.TheatreCode AND b.BranchNo = th.BranchNo GROUP BY sh.MovieNo , th.BranchNo ) AS t GROUP BY t.BranchName",
        "SELECT t.Genre, MIN(t.CusCount) AS min, AVG(t.CusCount) AS avg, MAX(t.CusCount) AS max FROM	(SELECT COUNT(ri.RecordIndex) AS CusCount , th.BranchNo, m.Genre FROM `reservation_items`ri, `reservation` r ,  `schedule` sh, `theatre` th, `movie` m WHERE ri.ReservationNo = r.ReservationNo AND r.ScheduleNo = sh.ScheduleNo AND sh.TheatreCode = th.TheatreCode AND m.MovieNo = sh.MovieNo GROUP BY m.Genre , th.BranchNo ) AS t GROUP BY t.Genre",
        "SELECT temp.MovieName, MIN(temp.Age) AS min, AVG(temp.Age) AS avg, MAX(temp.Age) AS max FROM    (SELECT TIMESTAMPDIFF(year,c.`BirthDate`,now()) AS Age, m.`MovieName` FROM schedule s, movie m, customer c, reservation r WHERE c.`CustomerNo` = r.`CustomerNo` AND s.`ScheduleNo` = r.`ScheduleNo` AND m.`MovieNo` = s.`MovieNo`) AS temp GROUP BY temp.MovieName",
        "SELECT temp.Genre, MIN(temp.Age) AS min, AVG(temp.Age) AS avg, MAX(temp.Age) AS max FROM    (SELECT TIMESTAMPDIFF(year,c.`BirthDate`,now()) AS Age, m.Genre FROM schedule s, movie m, customer c, reservation r WHERE c.`CustomerNo` = r.`CustomerNo` AND s.`ScheduleNo` = r.`ScheduleNo` AND m.`MovieNo` = s.`MovieNo`) AS temp GROUP BY temp.Genre",
        "SELECT temp.MovieName, MIN(temp.tPrice) AS min, AVG(temp.tPrice) AS avg , MAX(temp.tPrice) AS max FROM    (SELECT SUM(sc.Price) AS tPrice , b.BranchNo, b.BranchName, m.MovieNo, m.MovieName FROM reservation_items i, reservation r, seatclass sc, schedule s, movie m, branch b, theatre t WHERE i.ReservationNo = r.ReservationNo AND sc.ClassName = i.SeatClass AND r.ScheduleNo = s.ScheduleNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo AND s.MovieNo = m.MovieNo GROUP BY b.BranchNo, m.MovieNo) AS temp GROUP BY temp.MovieName",
        "SELECT temp.Genre, MIN(temp.tPrice) AS min, AVG(temp.tPrice) AS avg, MAX(temp.tPrice) AS max FROM (SELECT SUM(sc.Price) AS tPrice, m.Genre, b.BranchNo, b.BranchName FROM reservation_items i, reservation r, seatclass sc, schedule s, movie m, branch b, theatre t WHERE i.ReservationNo = r.ReservationNo AND sc.ClassName = i.SeatClass AND r.ScheduleNo = s.ScheduleNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo AND s.MovieNo = m.MovieNo GROUP BY b.BranchNo, m.Genre) AS temp GROUP BY temp.Genre",
        "SELECT temp.Studio, MIN(temp.tPrice) AS min, AVG(temp.tPrice) AS avg, MAX(temp.tPrice) AS max FROM    (SELECT SUM(sc.Price) AS tPrice, m.Studio, b.BranchNo, b.BranchName FROM reservation_items i, reservation r, seatclass sc, schedule s, movie m, branch b, theatre t WHERE i.ReservationNo = r.ReservationNo AND sc.ClassName = i.SeatClass AND r.ScheduleNo = s.ScheduleNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo AND s.MovieNo = m.MovieNo GROUP BY b.BranchNo, m.Studio) AS temp GROUP BY temp.Studio",
        "SELECT temp.BranchName, MIN(temp.tPrice) AS min , AVG(temp.tPrice) AS avg, MAX(temp.tPrice) AS max FROM    (SELECT SUM(sc.Price) AS tPrice, WEEK(r.DateCreated) as WeekOfYear, b.BranchNo, b.BranchName FROM reservation_items i, reservation r, seatclass sc, schedule s, branch b, theatre t WHERE i.ReservationNo = r.ReservationNo AND sc.ClassName = i.SeatClass AND r.ScheduleNo = s.ScheduleNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo GROUP BY WeekOfYear, b.BranchNo) AS temp GROUP BY temp.branchNo",
        "SELECT temp.BranchName, MIN(CusCount) AS min, AVG(CusCount) avg, MAX(CusCount) max FROM	(SELECT b.BranchName, b.BranchNo, WEEK(r.DateCreated) AS WeekNoOfYear , COUNT(YEAR(r.DateCreated)) AS CusCount FROM schedule s, reservation r, theatre t, branch b WHERE  r.`ScheduleNo` = s.`ScheduleNo` AND s.TheatreCode = t.TheatreCode AND b.BranchNo = t.BranchNo GROUP BY b.BranchNo,  WeekNoOfYear) AS temp GROUP BY temp.BranchNo",
        "SELECT temp.WeekDay, MIN(CusCount) AS min, AVG(CusCount) avg, MAX(CusCount) max FROM	(SELECT COUNT(c.CustomerNo) AS CusCount, b.BranchName, DAYOFWEEK(r.DateCreated) as WeekDay FROM schedule s, reservation r, theatre t, branch b, customer c WHERE s.`ScheduleNo` = r.`ScheduleNo` AND s.TheatreCode = t.TheatreCode AND b.BranchNo = t.BranchNo AND r.CustomerNo = c.CustomerNo GROUP BY WeekDay, BranchName) AS temp GROUP BY temp.WeekDay",
        "SELECT temp.MovieName, MIN(temp.shCount) AS min, AVG(temp.shCount) AS avg, MAX(temp.shCount) AS max FROM    (SELECT COUNT(s.ScheduleNo) AS shCount, m.MovieNo, m.MovieName, b.BranchNo, b.BranchName FROM schedule s, theatre t, branch b, movie m WHERE s.TheatreCode = t.TheatreCode AND b.BranchNo = t.BranchNo AND m.MovieNo = s.MovieNo GROUP BY m.MovieNo , b.BranchNo) AS temp GROUP BY temp.MovieName",
        "SELECT temp.Genre, MIN(temp.shCount) AS min, AVG(temp.shCount) AS avg, MAX(temp.shCount) AS max FROM    (SELECT COUNT(s.ScheduleNo) AS shCount, m.Genre, b.BranchNo, b.BranchName FROM schedule s, theatre t, branch b, movie m WHERE s.TheatreCode = t.TheatreCode AND b.BranchNo = t.BranchNo AND m.MovieNo = s.MovieNo GROUP BY b.BranchNo, m.Genre) AS temp GROUP BY temp.Genre",
        "SELECT temp.MovieName, MIN(temp.cuCount) AS min, AVG(temp.cuCount) AS avg , MAX(temp.cuCount) AS max FROM (SELECT COUNT(cu.CouponUsageNo) AS cuCount , m.MovieName, m.MovieNo FROM couponusage cu, reservation r, schedule s, theatre t, branch b, movie m WHERE cu.ReservationNo = r.ReservationNo AND r.ScheduleNo = s.ScheduleNo AND s.MovieNo = m.MovieNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo GROUP BY b.BranchNo, m.MovieNo) AS temp GROUP BY temp.MovieName",
        "SELECT temp.BranchName, MIN(temp.cuCount) AS min, AVG(temp.cuCount) AS avg , MAX(temp.cuCount) AS max FROM (SELECT COUNT(cu.CouponUsageNo) AS cuCount , m.MovieName, m.MovieNo, b.BranchName, b.BranchNo FROM couponusage cu, reservation r, schedule s, theatre t, branch b, movie m WHERE cu.ReservationNo = r.ReservationNo AND r.ScheduleNo = s.ScheduleNo AND s.MovieNo = m.MovieNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo GROUP BY b.BranchNo, m.MovieNo) AS temp GROUP BY temp.BranchNo",
        "SELECT temp.MovieName, MIN(Duration) AS min, AVG(Duration) AS avg, MAX(Duration) AS max FROM (SELECT TIMESTAMPDIFF(day,MIN(s.Date) , MAX(s.Date) )+1 AS Duration, m.MovieNo, m.MovieName, b.BranchNo, b.BranchName FROM schedule s, movie m, theatre t, branch b WHERE s.MovieNo = m.MovieNo AND s.TheatreCode = t.TheatreCode AND t.BranchNo = b.BranchNo GROUP BY m.MovieNo, b.BranchNo) AS temp GROUP BY temp.MovieName"
    ];
    mysql.connect(sql[req.params.number])
        .then((resp)=>{
            res.send(resp.rows);
        })
})

router.get('/shiftapplies/All',(req,res)=>{
    var sql = "SELECT * FROM `staff` s, `shiftapplies` sa, `shift` sh WHERE sa.ShiftNo = sh.ShiftNo AND sa.StaffNo = s.StaffNo";
    mysql.connect(sql)
        .then((resp)=>{
            res.send(resp.rows);
        })
})

// router.get('/staff/FirstName',(req,res)=>{

//     var sql = "SELECT Day, StartTime, EndTime FROM staff s, shiftapplies a,shift t WHERE t.ShiftNo = a.ShiftNo AND a.StaffNo = s.StaffNo AND s.StaffNo =;
//     console.log(sql);
    // mysql.connect(sql)
    //     .then((resp)=>{
    //         res.sendStatus(200);
    //     })
    //     .catch((err)=>{
    //         //console.log('update plan ERROR',err);
    //         res.sendStatus(500);
    //     });
//})

router.get('/staff/delete/:shift',(req,res)=>{
    var sql = "DELETE FROM `shift` WHERE `shift`.`ShiftNo` = "+req.params.shift+"";
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            //console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})

router.get('/staff/deleteshift/:shift',(req,res)=>{
    var sql = "DELETE FROM `shift` WHERE `shift`.`ShiftNo` = "+req.params.shift+"";
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            //console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})


router.get('/staff/deletename/:name',(req,res)=>{
    var sql = "DELETE FROM `staff` WHERE `staff`.`StaffNo` = "+req.params.name+"";
    //console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            //console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})

// router.post("/staff/update",(req,res)=>{
//     var data = req.body;
//     var sql = "INSERT INTO `shift` (`Day`,`StartTime`,`EndTime`) VALUE ('"+data.Day+"','"+data.StartTime+"','"+data.EndTime+"')"; 
//     console.log(sql);
// })

router.post("/staff/update",(req,res)=>{
    var data = req.body;
    var sql = "UPDATE `staff` SET `FirstName` = '"+data.staff.FirstName+"',`MidName` = '"+data.staff.MidName+"',`LastName` = '"+data.staff.LastName+"',`BirthDay`='"+data.staff.BirthDay+"',`CitizenID` = '"+data.staff.CitizenID+"',`Gender` ='"+data.staff.Gender+"',`HighestEdu`='"+data.staff.HighestEdu+"', `ImageURL` = '"+data.staff.ImageURL+"',`DateEmployed`='"+data.staff.DateEmployed+"', `Address`= '"+data.staff.Address+"', `PhoneNumber`='"+data.staff.PhoneNumber+"', `Marital`='"+data.staff.Marital+"', `Position` ='"+data.staff.Position+"', `BranchNo`='"+data.staff.BranchNo+"' WHERE `StaffNo` = '"+data.staff.StaffNo+"'";
    //console.log("SQL",sql);
    mysql.connect(sql)
        .then((resp)=>{
            console.log(data);
            if(data.shift){
                var insertID  = { staffid : resp.insertId , shiftid:""}
                var sql = "INSERT INTO `shift` (`Day`,`StartTime`,`EndTime`) VALUE ";
                    data.shift.forEach((value)=>{
                        var timestart = value.StartHH+":"+value.StartMM+":"+value.StartSS;
                        var timeend = value.EndHH+":"+value.EndMM+":"+value.EndSS;
                        sql += " ('"+value.Date+"','"+timestart+"','"+timeend+"'),";
                    });
                sql = sql.substring(0,sql.length-1);
                //console.log(sql);
                mysql.connect(sql)
                .then((resp)=>{
                //console.log(resp);
                insertID.shiftid = parseInt(resp.insertId);
                        var sql = "INSERT INTO `shiftapplies`(`StaffNo`, `ShiftNo`) VALUE";
                            for(var i=0; i<resp.rows.affectedRows;i++){
                                var real = insertID.shiftid+i;
                                sql += "('"+data.staff.StaffNo+"','"+real+"'),"
                            }
                            sql = sql.substring(0,sql.length-1);
                            console.log(sql);
                            mysql.connect(sql)
                            .then((resp)=>{
                                res.sendStatus(200);
                            })
                })
            }
            else res.sendStatus(200);
            
        })

})

router.post("/staff", (req, res) =>{
    console.log("staff");
    var data = req.body;
    var sql = "INSERT INTO `staff` (`FirstName`, `MidName`, `LastName`, `BirthDay`, `CitizenID`, `Gender`, `HighestEdu`, `ImageURL`, `DateEmployed`, `Address`, `PhoneNumber`, `Marital`, `Position` , `BranchNo`) VALUES ('"+
                data.staff.FirstName+"','"+ data.staff.MidName+"','"+data.staff.LastName+"','"+data.staff.BirthDay+"','"+data.staff.CitizenID+"','"+data.staff.Gender+"','"+data.staff.HighestEdu+"','"+data.staff.ImageURL+"','"+data.staff.DateEmployed+"','"+data.staff.Address+"','"+data.staff.PhoneNumber+"','"+data.staff.Marital+"','"+data.staff.Position+"','"+data.staff.BranchNo+"')";
    mysql.connect(sql)
        .then((resp)=>{
            if(data.shift){
                var insertID  = { staffid : resp.insertId , shiftid:""}
                var sql = "INSERT INTO `shift` (`Day`,`StartTime`,`EndTime`) VALUE";
                    data.shift.forEach((value)=>{
                        var timestart = value.StartHH+":"+value.StartMM+":"+value.StartSS;
                        var timeend = value.EndHH+":"+value.EndMM+":"+value.EndSS;
                        sql += " ('"+value.Date+"','"+timestart+"','"+timeend+"'),";
                    });
                sql = sql.substring(0,sql.length-1);
                console.log(sql);
                mysql.connect(sql)
                .then((resp)=>{
                        //console.log(resp);
                        insertID.shiftid = parseInt(resp.insertId);
                        var sql = "INSERT INTO `shiftapplies`(`StaffNo`, `ShiftNo`) VALUE";
                        for(var i=0; i<resp.rows.affectedRows;i++){
                            var real = insertID.shiftid+i;
                            sql += "('"+insertID.staffid+"','"+real+"'),"
                        }
                        sql = sql.substring(0,sql.length-1);
                        console.log(sql);
                        mysql.connect(sql)
                        .then((resp)=>{
                            res.sendStatus(200);
                        })
                    })
            }
            else res.sendStatus(200)
        })
    });

//=======================

// router.all('/', (req, res) => {
//     console.log(req.user);
//     res.render('index');
// });

router.get('/admin', checkAuthentication, (req,res) => {
    res.render('admin',{auth:true});
});

router.post('/login', 
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/?badlogin=true',
        failureFlash: true 
    }), (req,res) => {
    console.log('login route run!', req.body);
});
router.get('/logout', checkAuthentication, (req,res)=>{
    req.logout();
    res.redirect('/')
});

router.post('/branch', (req,res) => {
    var data = req.body;
    var sql = "INSERT INTO `branch` (`BranchName`, `BranchAddress`, `PhoneNumber`, `ManagerStaffNo`) VALUES ('"+
                data.Name+"','"+ data.Address+"','"+data.Phone+"','"+data.Manager+"')";
    mysql.connect(sql)
        .then((resp)=>{
            console.log(resp);
            res.redirect('/branch');
        });
    console.log(sql)
});



router.post('/movies', (req,res) => {
    var planWithSchedule =[];
    var SeatClass =[];
    var data = req.body;
    var total=0;
    var sql = "INSERT INTO `movie` (`MovieName`, `Director`, `Casts`, `Desc`, `Duration`, `Rate`, `Genre`, `Studio`, `PosterURL`) VALUES ('"+
                data.Movie.MovieName+"','"+ data.Movie.Director+"','"+data.Movie.Casts+"','"+data.Movie.Desc+"','"+data.Movie.Duration+"','"+data.Movie.Rate+"','"+data.Movie.Genre+"','"+data.Movie.Studio+"','"+data.Movie.PosterURL+"')";
    mysql.connect(sql)
        .then((resp)=>{
            console.log(resp);
            // res.redirect('/addSchedule');
                let MovieNo =resp.insertId;
                var sql2 = "INSERT INTO `schedule` (`MovieNo`, `TheatreCode`, `Date`, `Time`,`Audio`,`Dimension`,`Subtitle`) VALUES"
                data.schedule.forEach((value,key)=>{
                sql2 += "('"+MovieNo+"','"+ value.TheatreCode+"','"+value.Date+"','"+value.Time+":00"+"','"+value.Audio+"','"+value.Dimension+"','"+value.Subtitle+"'),";
               });
               sql2 = sql2.substring(0,sql2.length-1);
                console.log(sql2)
                  mysql.connect(sql2)
                      .then((resp)=>{
                          console.log("success")
                          let ScheduleNo =resp.insertId;
                          var sql3 = "SELECT schedule.scheduleNo, plan.PlanHeight,plan.PlanWidth,plan.SeatClass1,plan.NumberRow1,plan.SeatClass2,plan.NumberRow2,plan.SeatClass3,plan.NumberRow3,plan.SeatClass4,plan.NumberRow4 FROM schedule ,theatre ,plan WHERE schedule.TheatreCode=theatre.TheatreCode and plan.PlanName=theatre.PlanName and schedule.MovieNo="+MovieNo;
                 console.log(sql3)
                 mysql.connect(sql3)
                        .then((resp)=>{
                            resp.rows.forEach((value,key)=>{
                                planWithSchedule.push( {
                                scheduleNo :value.scheduleNo,
                                PlanHeight: value.PlanHeight,
                                PlanWidth:  value.PlanWidth,
                                SeatClass1: value.SeatClass1,
                                NumberRow1: value.NumberRow1,
                                SeatClass2: value. SeatClass2,
                                NumberRow2: value.NumberRow2,
                                SeatClass3: value.SeatClass3,
                                NumberRow3: value.NumberRow3,
                                SeatClass4: value.SeatClass4,
                                NumberRow4: value.NumberRow4
                                })
                            });
                            console.log(planWithSchedule)
                            var sql4 ="SELECT ClassName,Price,Width FROM seatclass";
                            console.log(sql4)
                            mysql.connect(sql4)
                                    .then((resp)=>{
                                        resp.rows.forEach((value,key)=>{
                                            SeatClass.push(  {
                                                ClassName :value.ClassName,
                                                Price :value.Price,
                                                Width :value.Width
                                            })
                                             });
                                             console.log(SeatClass)
                                            planWithSchedule.forEach((value,key)=>{
                                            total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Width))*value.NumberRow1
                                            console.log("1",total)
                                            if(value.SeatClass2!=null)
                                                {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Width))*value.NumberRow2
                                                console.log("2",total)}
                                            if(value.SeatClass3!=null)
                                                { total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Width))*value.NumberRow3
                                                console.log("3",total)}
                                            if(value.SeatClass4!=null)
                                                 {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Width))*value.NumberRow4
                                                    console.log("4",total)}
                                            
                                            });
                                            var sql5 ="INSERT INTO `movie_revenue` (`MovieNo`, `ExpectRevenue`) VALUES ('"+MovieNo+"','"+total+"')";
                                            mysql.connect(sql5)
                                            console.log(sql5)
                                            console.log(total)
                                            res.sendStatus(200)
                                                })
                    })
                     })
                    .catch((err)=>{
                         console.log('error',err);
                     });
});
});

router.delete('/Deletemovies', (req,res) => {
    var data = req.body;
    console.log(data)
    var sql = "Delete  From `movie` where MovieNo= "+data.MovieNo;
    console.log(sql)
    mysql.connect(sql)
        .then((resp)=>{
            console.log(resp);
            res.sendStatus(200)
        });
    console.log(sql)
})

router.delete('/DeleteSchedule', (req,res) => {
    var data = req.body;
    var total=0;
    var planWithSchedule =[];
    var SeatClass =[];
    console.log(data)
    var sql = "Delete  From `schedule` where ScheduleNo= "+data.ScheduleNo;
    console.log(sql)
    mysql.connect(sql)
        .then((resp)=>{
            var sql2 = "SELECT schedule.scheduleNo, plan.PlanHeight,plan.PlanWidth,plan.SeatClass1,plan.NumberRow1,plan.SeatClass2,plan.NumberRow2,plan.SeatClass3,plan.NumberRow3,plan.SeatClass4,plan.NumberRow4 FROM schedule ,theatre ,plan WHERE schedule.TheatreCode=theatre.TheatreCode and plan.PlanName=theatre.PlanName and schedule.MovieNo="+data.MovieNo;
            console.log(sql2) 
            mysql.connect(sql2)
         .then((resp)=>{
            resp.rows.forEach((value,key)=>{
                planWithSchedule.push( {
                scheduleNo :value.scheduleNo,
                PlanHeight: value.PlanHeight,
                PlanWidth:  value.PlanWidth,
                SeatClass1: value.SeatClass1,
                NumberRow1: value.NumberRow1,
                SeatClass2: value. SeatClass2,
                NumberRow2: value.NumberRow2,
                SeatClass3: value.SeatClass3,
                NumberRow3: value.NumberRow3,
                SeatClass4: value.SeatClass4,
                NumberRow4: value.NumberRow4
                })
            });
            console.log(planWithSchedule)
            console.log(planWithSchedule)
            var sql3 ="SELECT ClassName,Price,Width FROM seatclass";
            console.log(sql3)
            mysql.connect(sql3)
                    .then((resp)=>{
                        resp.rows.forEach((value,key)=>{
                            SeatClass.push(  {
                                ClassName :value.ClassName,
                                Price :value.Price,
                                Width :value.Width
                            })
                             });
                             console.log(SeatClass)
                            planWithSchedule.forEach((value,key)=>{
                            total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Width))*value.NumberRow1
                            console.log("1",total)
                            if(value.SeatClass2!=null)
                                {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Width))*value.NumberRow2
                                console.log("2",total)}
                            if(value.SeatClass3!=null)
                                { total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Width))*value.NumberRow3
                                console.log("3",total)}
                            if(value.SeatClass4!=null)
                                 {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Width))*value.NumberRow4
                                    console.log("4",total)}
                            
                            });
                            var sql4 ="UPDATE `movie_revenue`set `ExpectRevenue`='"+total+"' where`MovieNo`= "+data.MovieNo;
                            //var sql4 = "INSERT INTO `movie_revenue` (`MovieNo`, `ExpectRevenue`) VALUES ('"+data.Movie.MoveNo+"','"+total+"')";
                            mysql.connect(sql4)
                            console.log(sql4)
                            console.log(total)  
                            res.sendStatus(200)
                        })
                    })
                })
                    .catch((err)=>{
                    console.log('error',err);
                });
});

router.post('/moviesUpdate', (req,res) => {
    var data = req.body;
    console.log(data)
    var sql = "Update  `movie` SET `MovieName`='"+data.MovieName+"',`Director`='"+data.Director+"',`Casts`='"+data.Casts+"',`Desc`='"+data.Desc+"',`Duration`='"+data.Duration+"',`Rate`='"+data.Rate+"',`Genre`='"+data.Genre+"',`Studio`='"+data.Studio+"',`PosterURL`='"+data.PosterURL+"' where movie.`MovieNo`= "+data.MovieNo;
    console.log(sql)
    mysql.connect(sql)
        .then((resp)=>{
            console.log(resp);
            res.sendStatus(200)
        });
    console.log(sql)
})

router.post('/AddNewSchedule', (req,res) => {
    var data = req.body;
    var planWithSchedule =[];
    var SeatClass =[];
    var movieNo=data.Movie.MovieNo;
    var total=0;
    console.log(data)
    var sql;
        sql ="INSERT INTO `schedule` (`MovieNo`, `TheatreCode`, `Date`, `Time`,`Audio`,`Dimension`,`Subtitle`) VALUES"
    data.schedule.forEach((value)=>{
        sql += "('"+data.Movie.MoveNo+"','"+data.Movie.TheatreCode+"','"+value.Date+"','"+value.Time+":00"+"','"+value.Audio+"','"+value.Dimension+"','"+value.Subtitle+"'),";
    })
    sql= sql.substring(0, sql.length-1)
    console.log(sql)
    mysql.connect(sql)
        .then((resp)=>{
            var sql2 = "SELECT schedule.scheduleNo, plan.PlanHeight,plan.PlanWidth,plan.SeatClass1,plan.NumberRow1,plan.SeatClass2,plan.NumberRow2,plan.SeatClass3,plan.NumberRow3,plan.SeatClass4,plan.NumberRow4 FROM schedule ,theatre ,plan WHERE schedule.TheatreCode=theatre.TheatreCode and plan.PlanName=theatre.PlanName and schedule.MovieNo="+data.Movie.MoveNo;
            console.log(sql2) 
            mysql.connect(sql2)
         .then((resp)=>{
            resp.rows.forEach((value,key)=>{
                planWithSchedule.push( {
                scheduleNo :value.scheduleNo,
                PlanHeight: value.PlanHeight,
                PlanWidth:  value.PlanWidth,
                SeatClass1: value.SeatClass1,
                NumberRow1: value.NumberRow1,
                SeatClass2: value. SeatClass2,
                NumberRow2: value.NumberRow2,
                SeatClass3: value.SeatClass3,
                NumberRow3: value.NumberRow3,
                SeatClass4: value.SeatClass4,
                NumberRow4: value.NumberRow4
                })
            });
            console.log(planWithSchedule)
            console.log(planWithSchedule)
            var sql3 ="SELECT ClassName,Price,Width FROM seatclass";
            console.log(sql3)
            mysql.connect(sql3)
                    .then((resp)=>{
                        resp.rows.forEach((value,key)=>{
                            SeatClass.push(  {
                                ClassName :value.ClassName,
                                Price :value.Price,
                                Width :value.Width
                            })
                             });
                             console.log(SeatClass)
                            planWithSchedule.forEach((value,key)=>{
                            total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass1).Width))*value.NumberRow1
                            console.log("1",total)
                            if(value.SeatClass2!=null)
                                {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass2).Width))*value.NumberRow2
                                console.log("2",total)}
                            if(value.SeatClass3!=null)
                                { total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass3).Width))*value.NumberRow3
                                console.log("3",total)}
                            if(value.SeatClass4!=null)
                                 {total = total+SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Price * (Math.trunc(value.PlanWidth/SeatClass.find(SeatClass => SeatClass.ClassName === value.SeatClass4).Width))*value.NumberRow4
                                    console.log("4",total)}
                            
                            });
                            var sql4 ="UPDATE `movie_revenue`set `ExpectRevenue`='"+total+"' where`MovieNo`= "+data.Movie.MoveNo;
                            //var sql4 = "INSERT INTO `movie_revenue` (`MovieNo`, `ExpectRevenue`) VALUES ('"+data.Movie.MoveNo+"','"+total+"')";
                            mysql.connect(sql4)
                            console.log(sql4)
                            console.log(total)
                            res.sendStatus(200)
                                })
    })
     })
    .catch((err)=>{
         console.log('error',err);
     });
});

router.post('/coupon',(req, res) => {
    var data = req.body;
    console.log(data);
    
    var sql = "INSERT INTO `coupon` (`CouponCode`, `Discount`, `MaxDiscount`, `EXPDate`, `MinSpend`, `MinSeat`, `MinAge`, `MaxAge`,`NoAvailable`) VALUES ('"+
                data.Coupon.CouponCode+"','"+ data.Coupon.DiscountRate/100 +"','"+data.Coupon.MaxDiscount+"','"+data.Coupon.ExpireDate+"','"+data.Coupon.MinSpend+"','"+data.Coupon.MinSeat+"','"+data.Coupon.MinAge+"','"+data.Coupon.MaxAge+"','"+data.Coupon.Number+"')";
    mysql.connect(sql).then((resp)=>{
            console.log(resp);
            //let CouponBranchNo =resp.insertId;
            //var BranchId = data.BranchInput;
            var sql2 = "INSERT INTO `coupon_branch` (`BranchNo`, `CouponCode`) VALUES"
                data.BranchInput.forEach((value)=>{
                sql2 += "('"+ value+"','"+data.Coupon.CouponCode+"'),";
               });
            sql2 = sql2.substring(0,sql2.length-1);
                console.log(sql2)
                  mysql.connect(sql2).then((resp)=>{
                      //let CouponMovieNo =resp.insertId;
                      //var MovieId = data.MovieInput;
                      var sql3 = "INSERT INTO `coupon_movie` ( `MovieNo`, `CouponCode`) VALUES"
                data.MovieInput.forEach((value)=>{
                sql3 += "('"+ value+"','"+data.Coupon.CouponCode+"'),";
               });
            sql3 = sql3.substring(0,sql3.length-1);
                console.log(sql3)
                  mysql.connect(sql3).then((resp)=>{
                      console.log("success")
                     })
                    .catch((err)=>{
                         console.log('error',err);
                     });
            });
    });     
});

router.get('/coupon/delete/:coupon',(req,res)=>{
    var sql = "DELETE FROM `coupon` WHERE `coupon`.`CouponCode` = '"+req.params.coupon+"'";
    console.log(sql);
    mysql.connect(sql)
        .then((resp)=>{
            res.sendStatus(200);
        })
        .catch((err)=>{
            console.log('update plan ERROR',err);
            res.sendStatus(500);
        });
})


module.exports = router;

