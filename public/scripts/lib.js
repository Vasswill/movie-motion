const fetchData = (topic, data, next) => {
    switch(topic){
        case 'user':{
            $.get('/user', {
                columns:data
            },(data,status)=>{
                next(data,null);
            }).fail((err)=>{
                next(null,err);
            });
            break;
        }
        default: {
            $.get('/'+topic,data, (dataBack,status)=>{
                next(dataBack,null);
            }).fail((err)=>{
                next(null,err);
            });
            break;
        }
    }
}

const fetchDataPromise = (topic, data) => {
    return new Promise(function(resolve, reject){
        fetchData(topic, data, (data, err)=>{
            if(!err){
                resolve(data);
            }else reject(err);
        })
    });
}

(function() {
    Date.prototype.toYMD = Date_toYMD;
    Date.prototype.withoutTime = wot;
    function Date_toYMD() {
        var year, month, day;
        year = String(this.getFullYear());
        month = String(this.getMonth() + 1);
        if (month.length == 1) {
            month = "0" + month;
        }
        day = String(this.getDate());
        if (day.length == 1) {
            day = "0" + day;
        }
        return year + "-" + month + "-" + day;
    }
    function wot(){
        var d = new Date(this);
        d.setHours(0, 0, 0, 0);
        return d;
    }
})();

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

class ticketingProcess {
    constructor(formElem, scheduleArray=undefined, movieObj=undefined, auth=false, webState, step=0){
        this.step = step;
        this.movie = movieObj;
        this.schedules = scheduleArray;
        this.selectSchedule = undefined;
        this.isGuest = auth;
        this.form = formElem; //Jquery Element Only
        this.temp={};
        this.allowSubmit = false;
        this.webState = webState;
        if(this.movie) this.showPoster;

        let s = this;
        this.form.find('.day-toggle .toggle-item').click(function(e){
            s.form.find('#tab1-branchNo').val('');
            s.form.find('#tab1-scheduleNo').val('');
            s.allowContinue(s.form);
            iziToast.destroy();
            iziToast.show({
                title: 'Status ',
                icon: 'fas fa-info',
                message: 'Select Schedule On Date: '+$(this).data('selectDate'),
                position: 'topCenter',
                color: 'blue',
                close: false
            });
            s.processSchedule($(this).data('selectDate'));
        });

        this.form.find('input').addClass('inactiveStep');
        this.form.find('input').off('keypress');
        this.validator = this.form.validate({
            rules: { 
                "seatCode[]": { 
                        required: true, 
                        minlength: 1 
                } 
            }, 
            messages: {
                movieName: {
                    required: "Please select a movie of your choice"
                },
                movieNo: {
                    required: ""
                },
                branchNo:{
                    required: ""
                },
                scheduleNo:{
                    required: ""
                },
                userEmail:{
                    required: "Please enter your email address"
                },
                userTele:{
                    required: "Your telephone number is needed"
                },
                "seatCode[]":{
                    required: '',
                    minlength: ''
                },
                customerNo:'',
                username:''
            },
            ignore: ".inactiveStep"
        });
    }

    showPoster(){
        if(this.isShownPoster) return;
        let data = {
            data: this.movie,
            mode: 'popup-row'
        };
        let posterHtml = new EJS({url:'/client-templates/movie-poster'}).render(data);
        this.form.closest('.popup-area').prepend(posterHtml);
        this.isShownPoster = true;
    }

    iterate(targetStep=undefined){
        //console.log('iterate', this.step, targetStep);
        if(typeof targetStep!='undefined'){
            this.step = targetStep;
            if(targetStep==0) this.kill();
        }
        this.form.find('.form-tab').addClass('hide');
        this.form.find('.form-tab#tab'+(typeof targetStep=='undefined' ? ++this.step : targetStep)).removeClass('hide');
        
        this.form.find('input').addClass('inactiveStep');
        this.form.find('.form-tab#tab'+(typeof targetStep=='undefined' ? this.step : targetStep)+' input').removeClass('inactiveStep');
        
        this.worker();

        this.validator.resetForm();
        this.form.closest('.popup-window').find('.popup-footer :nth-child(2)').attr("disabled", true);
        this.form.closest('.popup-window').find('.popup-footer :nth-child(1)').off('click').click(()=>{
            console.log('retrograde');
            this.iterate(this.step-1);
            if(this.step > 0) this.form.find('.form-tab#tab'+this.step+' input').val('');
        });
        this.form.closest('.popup-window').find('.popup-footer :nth-child(2)').off('click').click(()=>{
            if(this.form.valid()) {
                this.iterate(this.step+1);
            }
        });

        if(this.step==2){
            iziToast.warning({
                position: "topCenter", 
                icon: 'fas fa-hourglass-start',
                title: 'Loading', 
                message: 'Retriving Theatre Seat Data',
                close: false,
                overlay: true,
                displayMode:1,
                timeout: false
            });
        }

        if(this.step==3){
            this.form.closest('.popup-window').find('.popup-footer :nth-child(2)').hide();
            this.form.closest('.popup-window').find('.popup-footer').append('<button type="submit" class="btn-cornblue submit-btn"><i class="fas fa-cash-register"></i></button>');
            this.allowContinue(this.form, this.form.closest('.popup-window').find('.popup-footer .submit-btn').attr("disabled", true));
            let self = this;
            this.form.closest('.popup-window').find('.popup-footer .submit-btn').off('click').click(function(e){
                if(self.allowSubmit){
                    //prompt loading
                    iziToast.show({
                        position: "topCenter", 
                        iconUrl: '/assets/images/load_placeholder.svg',
                        title: 'Processing', 
                        color: 'yellow',
                        message: 'Please Wait',
                        timeout: false,
                        overlay: true,
                        close: false
                    });
                    //send form wait for status and tickets
                    $.ajax({
                        url: '/reservation',
                        type: 'POST',
                        data: self.form.serialize(),
                        success:function(ticketData){
                            window.location.replace('/?reservationNo='+ticketData.ReservationKey+'&scheduleNo='+ticketData.ScheduleNo);
                        },
                        error:function(jqXhr, textStatus){
                            iziToast.destroy();
                            iziToast.show({
                                title: 'Incomplete! ',
                                icon: 'fas fa-bug',
                                message: 'Ticket Reservation Failed ('+textStatus+')',
                                position: 'topCenter',
                                color: 'red',
                                close: false
                            });
                        }
                    });
                }
            });
        }else{
            this.form.closest('.popup-window').find('.popup-footer .submit-btn').remove();
            this.form.closest('.popup-window').find('.popup-footer :nth-child(2)').show();
        }
    }

    allowContinue(form, button = undefined){
        if(form.valid()){
            form.closest('.popup-window').find('.popup-footer :nth-child(2)').attr("disabled", false);
            if(button)button.attr("disabled", false);
        }else{
            form.closest('.popup-window').find('.popup-footer :nth-child(2)').attr("disabled", true);
            if(button)button.attr("disabled", true);
        }
    }

    worker(customStep=null){
        this.form.closest('.popup-window').find('.popup-body').css('overflow-y','scroll');
        switch(customStep==null ? this.step:customStep){
            case 0:{
                this.form.closest('.popup-window').find('.popup-body').css('overflow-y','visible');
                break;
            }
            case 1:{
                let mon_template = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let today = new Date();
                let today_num = today.getDate();
                let today_mon = mon_template[today.getMonth()];
                let tmr = new Date(today.getTime() + (24 * 60 * 60 * 1000));
                let tmr_num = tmr.getDate();
                let tmr_mon = mon_template[tmr.getMonth()];

                this.form.find('#today-num').text(today_num);
                this.form.find('#today-num').closest('.toggle-item').data('selectDate', today);
                this.form.find('#today-mon').text(today_mon);
                this.form.find('#tmr-num').text(tmr_num)
                this.form.find('#tmr-num').closest('.toggle-item').data('selectDate', tmr);
                this.form.find('#tmr-mon').text(tmr_mon);

                if(typeof this.webState.temp.branchSelection != 'undefined'){
                    //add selecting branch to input
                    this.form.find('#tab1-branchNo').val(this.webState.temp.branchSelection);
                }
                this.form.closest('.popup-window').find('.popup-footer').children().remove();
                this.form.closest('.popup-window').find('.popup-footer').append('<i class="nav-btn fas fa-arrow-circle-left"></i><i class="nav-btn fas fa-arrow-circle-right"></i>');
                this.showPoster();
                this.form.closest('.popup-area').addClass('row');
                this.form.closest('.popup-window').addClass('plain');
                
                this.form.find('#tab1 #tab1-movieName, #tab3-movieName').text(this.movie.MovieName);
                this.form.find('#tab1 #tab1-movieDesc').text(this.movie.Desc);
                this.form.find('#tab1 #tab1-movieName+span .head-text-badge, #tab3-badge').children().remove();
                this.form.find('#tab1 #tab1-movieName+span .head-text-badge, #tab3-badge').append("<span class='badge'>"+this.movie.Genre+"</span>");
                this.form.find('#tab1 #tab1-movieName+span .head-text-badge, #tab3-badge').append("<span class='badge'>"+this.movie.Rate+"</span>");

                let dateFromToggle = this.form.find('.day-toggle .toggle-item.active').data('selectDate');
                this.processSchedule(dateFromToggle);

                break;
            }
            case 2: {
                this.form.find('.seat-renderarea').children().remove();
                this.fetchReserved(this.temp.scheduleSelection)
                .then((reserved)=>{
                    
                    let markedSeat = {}
                    if(typeof reserved!='undefined' && reserved!='') reserved.forEach((entry)=>{
                        markedSeat[entry.SeatCode] = entry;
                    });

                    this.form.find('.seat-row .error').css('position','absolute');
                    this.form.find('#tab2-theatreCode').text(this.temp.scheduleSelection.TheatreCode);
                    if(typeof this.temp.seatClassForPlan != 'undefined'){
                        let rowNum = 0;
                        
                        let renderarea = this.form.find('#tab2 .seat-renderarea');
                        renderarea.children().remove();
                        renderarea.closest('.popup-window').find('#tab2-class-display').children().remove();
                        renderarea.append('<div class="seat-row"></div>');
                        
                        for(let i=1;i<=this.temp.seatClassForPlan.length;i++){
                            let seatclass = undefined;
                            this.temp.seatClassForPlan.forEach(sc=>{
                                if(sc.ClassName == this.temp.planSelection['SeatClass'+i]){
                                    seatclass = sc;
                                }
                            });
                            let nPerRow = Math.floor(this.temp.planSelection.PlanWidth / seatclass.Width);
                            let nRow = this.temp.planSelection['NumberRow'+i];
                            let DOMWidthPercent = 100/nPerRow;
                            let price = seatclass.Price;
                            let isCouple = !!seatclass.Couple;

                            for(let seatNum=0; seatNum<nPerRow*nRow; seatNum++){
                                let seatNumForThisRow = seatNum%(nPerRow)+1;
                                let seatChar = rowNum==0? String.fromCharCode(65 + rowNum%26).repeat(1) : String.fromCharCode(65 + rowNum%26).repeat(Math.ceil(rowNum/rowNum));
                                let seatCode = seatChar+seatNumForThisRow;
                                
                                if(typeof markedSeat[seatCode]=='undefined'){renderarea.children().last().append('<input type="checkbox" class="seat-dot-checkbox inactiveStep" id="'+seatCode+'" name="seatCode[]" value='+seatCode+' data-seatcode="'+seatCode+'" data-seatprice="'+price+'">');}
                                else{renderarea.children().last().append('<input type="checkbox" class="seat-dot-checkbox inactiveStep" id="'+seatCode+'" name="seatCode[]" value='+seatCode+' data-seatcode="'+seatCode+'" data-seatprice="'+price+'"disabled>');}
                                renderarea.children().last().append('<label for="'+seatCode+'" class="seat-dot available '+(isCouple ? 'couple':'')+' class-order-'+i+'" data-seatcode="'+seatCode+'"></label>');
                                
                                if(seatNumForThisRow==nPerRow){
                                    rowNum++;
                                    renderarea.append('<div class="seat-row"></div>');
                                }
                            }
                            if(this.step==2) renderarea.closest('.popup-window').find('#tab2-class-display').append('<span><label class="seat-dot available '+(isCouple ? 'couple':'')+' class-order-'+i+'"></label> '+seatclass.ClassName+(isCouple ? ' [Couple Seat]':'')+'</br>('+seatclass.Price+' .-)</span>'); 
                        };

                        renderarea[0].scrollLeft = renderarea.children().first().width() / 2 - renderarea.width()/2;
                        if(this.step==2){
                            renderarea.closest('.popup-window').find('#tab2-price-display').children().remove();
                            renderarea.closest('.popup-window').find('#tab2-price-display').append('<div class="level2"><span id="tab2-seat-selection">0</span> Seat(s) Selected</div>');
                            renderarea.closest('.popup-window').find('#tab2-price-display').append('<div class="level2">(Total Price:<span id="tab2-price-selection">0</span> Baht)</div>');
                        }
                        this.temp.seatSelection = 0;
                        this.temp.rawPrice = 0;
                        this.temp.seatList = [];
                        let temp = this.temp;
                        let self = this;
                        renderarea.find('input[type=checkbox].seat-dot-checkbox').change(function(e){
                            let numberTarget = renderarea.closest('.popup-window').find('#tab2-seat-selection');
                            let priceTarget = renderarea.closest('.popup-window').find('#tab2-price-selection');
                            if($(this)[0].checked){
                                numberTarget.text(++temp.seatSelection);
                                temp.rawPrice += parseFloat($(this).data('seatprice'));
                                priceTarget.text(temp.rawPrice);
                                temp.seatList.push({
                                    seatCode: $(this).data('seatcode'),
                                    fullPrice: $(this).data('seatprice')
                                });
                            }else{
                                numberTarget.text(--temp.seatSelection);
                                temp.rawPrice -= parseFloat($(this).data('seatprice'));
                                priceTarget.text(temp.rawPrice);
                                let newSeatList = [];
                                temp.seatList.forEach((seat)=>{
                                    if(seat.seatCode != $(this).data('seatcode')){
                                        newSeatList.push(seat);
                                    }
                                });
                                temp.seatList = newSeatList;
                                
                            }
                            self.allowContinue(self.form);
                        });
                        let ticketprocess = this;
                        let enableDrag = false;
                        let dragstartX = 0;
                        let dragstartY = 0;
                        let power = 0.1;
                        renderarea.off('mousedown').mousedown(function(e){
                            if(ticketprocess.step == 2){
                                enableDrag = true; 
                                dragstartX=e.pageX;
                                dragstartY=e.pageY;
                            }
                            e.preventDefault();
                        });
                        renderarea.off('mouseup').mouseup(function(e){
                            enableDrag = false;
                            e.preventDefault();
                        });
                        renderarea.off('mousemove').mousemove(function(e){ 
                            if(typeof enableDrag != 'undefined'){
                                if(enableDrag && ticketprocess.step == 2) {
                                    let deltaX=e.pageX - dragstartX; 
                                    let deltaY=e.pageY - dragstartY; 
                                    $(this)[0].scrollLeft -= (deltaX*power);
                                    $(this)[0].scrollTop -= (deltaY*power);
                                }
                            }
                            e.preventDefault();
                        });
                        renderarea.off('mouseleave').mouseleave(function(e){
                            power = 0;
                            e.preventDefault();
                        });
                        renderarea.off('mouseover').mouseover(function(e){
                            power = 0.1;
                            e.preventDefault();
                        });
                    }

                    if(this.step==2){
                        this.form.find("#tab2 input.inactiveStep").removeClass('inactiveStep');
                    }
                    iziToast.destroy();
                })
                .catch(err=>{
                    iziToast.show({
                        title: 'Bummer! ',
                        icon: 'fas fa-bug',
                        message: 'Theatre Seat API Failed, \n('+err+')',
                        position: 'topCenter',
                        color: 'red',
                        close: false
                    });
                })
                break;
            }
            case 3:{
                if(this.webState.isAuth){
                    this.form.find('#tab3-login-widget').hide();
                    this.form.find('#tab3-member-widget').show();
                    this.form.find('#tab3 #ticketing-coupon').attr('disabled', false);
                    this.form.find('#tab3 #tab3-customerNo').val(this.webState.userData.customerNo);
                    this.form.find('#tab3 #tab3-userName').val(this.webState.userData.username);
                    this.allowSubmit = true;
                    this.form.closest('.popup-window').find('.popup-footer .submit-btn').attr('disabled', false);
                }else{
                    iziToast.warning({
                        position: "topCenter", 
                        icon: 'fas fa-exclamation-circle',
                        title: 'Member Only', 
                        message: 'Sorry, please login to book a seat',
                        close: false
                    });
                    this.form.find('#tab3 #tab3-customerNo').val('');
                    this.form.find('#tab3 #tab3-userName').val('');
                    this.form.find('#tab3-login-widget').show();
                    this.form.find('#tab3-member-widget').hide();
                    this.form.find('#tab3 #ticketing-coupon').attr('disabled', true);
                }

                $('#tab3-time-period').text(this.temp.scheduleSelection.Time);
                $('#tab3-branchName').text(this.temp.scheduleSelection.BranchName);
                $('#tab3-theatreCode').text(this.temp.scheduleSelection.TheatreCode);
                $('#tab3-seat-table').find('tr:not(.protect)').remove();
                this.form.find('#tab3-discount-rate').text('0%');
                this.form.find('#ticketing-coupon').val('');

                let totalPrice = 0;
                this.temp.seatList.forEach((seat)=>{
                    totalPrice += parseFloat(seat.fullPrice);
                    $('#tab3-seat-table').prepend('<tr><td>'+seat.seatCode+'</td><td id="tab3-'+seat.seatCode+'-billing">'+seat.fullPrice+'.-</td></tr>');
                })
                $('#tab3-total-price').text(totalPrice+'.-');
                $('#tab3-subtotal-price').text(totalPrice+'.-');
                let self = this;
                let checkToken = false;
                let checkCount = 0;

                this.form.find('#ticketing-coupon').off('input propertychange').on('input propertychange', function(e){
                    if(!checkToken){
                        let usingVal = $(this).val();
                        //loading and prevent submit
                        $(this).addClass('holding-input');
                        self.form.closest('.popup-window').find('.popup-footer .submit-btn').attr("disabled", true);
                        self.allowSubmit = false;

                        setTimeout(()=>{ 
                            if(usingVal != $(this).val() || usingVal == '') return;
                            //use the token and stop altering input
                            checkToken = !checkToken;

                            //coupon validation & application begin
                            fetchData('coupon',{code: $(this).val().toUpperCase()},(data,err)=>{
                                console.log('fetch coupon with code = ', $(this).val());
                                if(!err){
                                    console.log('coupon response=>',data);
                                    if(data.length > 0){
                                        //calculate criteria result
                                        let coupon = data[0];
                                        console.log('this is coupon data', coupon);
                                        //validate requirement (if not pass return like is null)
                                            //check coupon
                                            let todayDate = new Date();
                                            let expDate = new Date(coupon.EXPDate);
                                            let expPass = todayDate < expDate;

                                            let totalPrice = 0;
                                            self.temp.seatList.forEach((seat)=>{totalPrice += seat.fullPrice});
                                            let spendPass = totalPrice >= coupon.MinSpend;
                                            let minSeatPass = self.temp.seatList.length >= coupon.MinSeat;
                                            let availablePass = coupon.NoAvailable > 0;
                                            
                                            //create allowing branch and movie data
                                            let couponBranchData = [];
                                            let couponMovieData = [];
                                            let branchNo = self.form.find('#tab1-branchNo').val();
                                            let movieNo = self.form.find('#movieNo').val();
                                            
                                            console.log(data)
                                            data.forEach((row)=>{
                                                if(!couponBranchData.includes(row.BranchNo)){
                                                    couponBranchData.push(row.BranchNo);
                                                }
                                                if(!couponMovieData.includes(row.MovieNo)){
                                                    couponMovieData.push(row.MovieNo);
                                                }
                                            });
                                            console.log('ccc',branchNo,movieNo,couponBranchData,couponMovieData);
                                            //check coupon schedule
                                            let branchPass = couponBranchData.includes(parseInt(branchNo));
                                            if(!branchPass) console.log('==> Ticket for branch(',branchNo,') not satisfy coupon(',coupon.CouponCode,')');
                                            //check coupon seatclass
                                            let moviePass = couponMovieData.includes(parseInt(movieNo));
                                            if(!moviePass) console.log('==> Ticket for movie(',movieNo,') not satisfy coupon(',coupon.CouponCode,')');
                                        
                                            console.log(expPass ,spendPass,minSeatPass,availablePass,branchPass,moviePass);
                                        if(expPass && spendPass && minSeatPass && availablePass && branchPass && moviePass){
                                            //calculate discount
                                            let discountPercent = data[0].Discount*100;
                                            let deduction = totalPrice*coupon.Discount;
                                            if(coupon.MaxDiscount != 0 && coupon.MaxDiscount != null) deduction = coupon.MaxDiscount;
                                            if(totalPrice-deduction<0) deduction=totalPrice;
                                            let discountPrice = totalPrice-deduction;
                                            //confirm on screen
                                            iziToast.show({
                                                title: '&#128537; Hooray! ',
                                                message: 'Coupon "'+data[0].CouponCode+'" Applied (Deducted'+deduction+'.-)',
                                                position: 'topCenter',
                                                color: 'green',
                                                close: false
                                            });
                                            
                                            //apply discount (just show to screen)
                                            self.form.find('#tab3-discount-rate').text(discountPercent.toString(10)+'%');
                                            if(coupon.MaxDiscount != 0 && coupon.MaxDiscount != null) self.form.find('#tab3-discount-rate').text(deduction.toString(10)+'.-');
                                            self.form.find('#tab3-total-price').text(discountPrice.toString(10)+'.-');
                                        }else{
                                            let notPassReq = undefined;
                                            if(!expPass){
                                                notPassReq = "Coupon Expired";
                                            }else if(!spendPass){
                                                notPassReq = "Total Spending Is Not Enough";
                                            }else if(!minSeatPass){
                                                notPassReq = "No. of Seat Less Than Minimum";
                                            }else if(!availablePass){
                                                notPassReq = "Out of Coupon";
                                            }else if(!branchPass){
                                                notPassReq = "Branch '"+self.webState.temp.branchSelection.name+"' Can't Apply This Coupon";
                                            }else if(!moviePass){
                                                notPassReq = "This Movie Can't Apply This Coupon";
                                            }else{
                                                notPassReq = "Try Another Coupon";
                                            }
                                            iziToast.show({
                                                title: '&#128549; Coupon Not Applied',
                                                message: 'Coupon Requirement Not Met\n '+notPassReq,
                                                position: 'topCenter',
                                                color: 'red',
                                                close: false
                                            });
                                            let totalSpend = 0;
                                            self.temp.seatList.forEach((seat)=>{totalSpend += seat.fullPrice});
                                            self.form.find('#tab3-discount-rate').text('0%');
                                            self.form.find('#tab3-total-price').text(totalSpend.toString(10)+'.-');
                                            $(this).val('');
                                        }
                                    }else{
                                        //prompt not found toast
                                        iziToast.show({
                                            title: '&#128551; Oops!',
                                            message: 'Coupon "'+$(this).val().toUpperCase()+'" Not Found...\t',
                                            position: 'topCenter',
                                            color: 'red',
                                            close: false
                                        });
                                        //revert to original price
                                        let totalSpend = 0;
                                        self.temp.seatList.forEach((seat)=>{totalSpend += seat.fullPrice});
                                        self.form.find('#tab3-discount-rate').text('0%');
                                        self.form.find('#tab3-total-price').text(totalSpend.toString(10)+'.-');
                                        $(this).val('');
                                    }
                                }else{
                                    console.log(err);
                                }
                                //release the token
                                checkToken = !checkToken;
                                $(this).removeClass('holding-input');
                                //allow form submit after coupon application has concluded
                                self.allowSubmit = true;
                                self.allowContinue(self.form, self.form.closest('.popup-window').find('.popup-footer .submit-btn'));
                            }); 
                        }, 3000);
                        
                    }
                });
                break;
            }
        }
    }

    fetchReserved(schedule){
        let self = this;
        return new Promise(function(resolve, reject) {
            let scheduleNo = schedule.ScheduleNo;
            fetchData('reservation/'+scheduleNo, null, (data, err)=>{
                if(!err){
                    self.temp.reservedSeat = data;
                    resolve(data);
                }else {
                    reject(err);
                }
            });
        });
    }

    kill(){
        console.log('kill');
        this.step = 0;
        this.isShownPoster = false;
        this.form.closest('.popup-area').find('.floating').remove();
        this.form.closest('.popup-window').find('.popup-footer').children().remove();
        this.form.closest('.popup-area').removeClass('row');
        this.form.closest('.popup-window').removeClass('col-8 plain');
    }

    processSchedule = (date) => {
        this.temp.branchSchedule = {}
        this.schedules.forEach((schedule) => {
            if(new Date(schedule.Date).withoutTime()-date.withoutTime()==0){
                if(typeof this.temp.branchSchedule[schedule.BranchName] == 'undefined') this.temp.branchSchedule[schedule.BranchName] = [];
                this.temp.branchSchedule[schedule.BranchName].push(schedule);
            }
        });

        this.form.find('#tab1 #tab1-branch-list').children().remove();
        this.form.find('#tab1 #tab1-schedule-list').children().remove();
        
        Object.keys(this.temp.branchSchedule).forEach((branchName)=>{
            this.form.find('#tab1 #tab1-branch-list').append('<li data-branch="'+branchName+'">'+branchName+'</li>');
            let form = this.form;
            let slf = this;
            let ws = this.webState;
            this.form.find('#tab1 #tab1-branch-list').children().last().click(function(e){
                $(this).addClass('selected');
                $(this).siblings().removeClass('selected');
                form.find('#tab1 #tab1-schedule-list li').hide();
                form.find('#tab1 #tab1-schedule-list li[data-branch="'+$(this).data('branch')+'"]').show();

                form.find('#tab1-branchNo').val('');
                form.find('#tab1-scheduleNo').val('');
                slf.allowContinue(slf.form);
                form.find('#tab1 #tab1-schedule-list li').removeClass('selected');
            });
            this.temp.branchSchedule[branchName].forEach((schedule)=>{
                this.form.find('#tab1 #tab1-schedule-list').append('<li data-branch="'+branchName+'"> <strong>Theatre</strong> '+schedule.TheatreCode+'  |  <i class="fas fa-clock"></i>  '+schedule.Time+'<span class="badge" style="margin-left: 1rem;">'+schedule.Dimension+'</span></li>');
                if(this.webState.temp.branchSelection.name != branchName){this.form.find('#tab1 #tab1-schedule-list').children().last().hide();}
                else this.form.find('#tab1 #tab1-branch-list').children().last().addClass('selected');
                let origin = this;
                this.form.find('#tab1 #tab1-schedule-list').children().last().click(function(){
                    form.find('#tab1-branchNo').val(schedule.BranchNo);
                    form.find('#tab1-scheduleNo').val(schedule.ScheduleNo);
                    $('#buy-ticket-popup').trigger('get-theatre-plan', [schedule]);
                    origin.temp.scheduleSelection = schedule;
                    $(this).addClass('selected');
                    $(this).siblings().removeClass('selected');
                    origin.allowContinue(origin.form);
                });
            });
        });

        if(this.form.find('#tab1 #tab1-branch-list').children().length == 0){
            this.form.find('#tab1 #tab1-branch-list').append('<div class="maintenance">This movie has no schedule on this day</div>');
        }
        if(this.form.find('#tab1 #tab1-schedule-list').children().length == 0){
            this.form.find('#tab1 #tab1-schedule-list').append('<div class="maintenance">This movie has no schedule on this day</div>');
        }
    }
}
class webstate{
    constructor(auth){
        this.isAuth = auth;
        this.role = this.isAuth ? uRole:undefined;
        this.temp = {};
        /*iziToast.show({
            class: 'fetchToast',
            position: "topCenter", 
            iconUrl: '/assets/images/load_placeholder.svg',
            title: 'Fetching Data', 
            color: 'green',
            message: 'Please Wait',
            timeout: false,
            overlay: true,
            close: false
        });*/
        if(typeof this.role!='undefined') this.role = this.role == 2 ? 'admin':'user';
        if(this.isAuth) {
            let self = this;
            fetchDataPromise('user',['*'])
            .then((data)=>{
                this.userData = data;
                this.updateUIByAuth();
            })
            .then(()=>{
                fetchData('reservation/customer', {customerId: this.userData.CustomerNo}, (data,err)=>{
                    if(!err){
                        self.userData.Reservations = data;
                        self.updateReservationProfile();
                    }
                });
            })
            .catch((err)=>{
                iziToast.destroy();
                iziToast.show({
                    title: 'Fetching Failed! ',
                    icon: 'fas fa-bug',
                    message: 'with error ('+err+')',
                    position: 'topCenter',
                    color: 'red',
                    close: false
                });
            }); 
        }
        fetchData('movies',{status: 'show', dateStart: new Date().toYMD(), dateStop: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).toYMD() },(data,err)=>{
            if(!err){
                this.showingList = data;
                this.renderMoviesGrid($('.program-row'), 'index-row');
                this.renderMoviesGrid($('.reserv-render-area'));
                var toast = document.querySelector('.fetchToast'); // Selector of your toast
                if(toast!=null&&toast!=undefined) iziToast.hide({}, toast);
            }else{
                console.log(err);
            }
        }); 
    }

    setHoldingSchedule = (schedule) =>{
        this.schedule = schedule;
    }

    updateReservationProfile = () => {
        if(typeof this.userData.Reservations == 'undefined') return;
        console.log(this.userData.Reservations);
        //get openlist element
        let datebookList = $('#user-ticket-datebook');
        let scheduleList = $('#user-ticket-schedule');
        let bookList = $('#user-ticket-reservation');
        let infoList = $('#user-ticket-detail');
        //remove all children on init
        datebookList.children().remove();
        bookList.children().remove();
        scheduleList.children().remove();

        let totalReservation = 0;
        //loop by each DateCreated
        Object.keys(this.userData.Reservations).forEach((bookingDate)=>{
            //append date
            datebookList.append('<li data-book-date="'+bookingDate+'">'+bookingDate+'</li>');
            //on select date
            datebookList.children().last().off('click focusReservation').on('click focusReservation',function(e){
                $(this).addClass('selected');
                //hide all descendant list element
                scheduleList.children().hide();
                bookList.children().hide()
                infoList.children().hide();
                //deselect all sibling
                $(this).siblings().removeClass('selected');
                scheduleList.children().removeClass('selected');
                bookList.children().removeClass('selected');
                //show specific schedule by bookDate
                let selectDate = $(this).data('bookDate');
                scheduleList.find('li[data-book-date="'+selectDate+'"]').show();
                if(e.type=='focusReservation'){
                    let thisElemOffsetFromTop = $(this)[0].offsetTop;
                    datebookList[0].scrollTop = thisElemOffsetFromTop;
                }
            });
            //loop by each reservation
            this.userData.Reservations[bookingDate].forEach((reservation, i)=>{
                let mon_template = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let movieName = reservation[0].MovieName;
                let scheduleNo = reservation[0].ScheduleNo;
                let playDate = new Date(reservation[0].PlayDate);
                playDate = playDate.getDate()+'-'+(mon_template[playDate.getMonth()])+'-'+playDate.getFullYear();
                let playTime = reservation[0].PlayTime;
                
                //append schedule (prevent repeat)
                if(scheduleList.find('li[data-schedule-no="'+scheduleNo+'"][data-book-date="'+bookingDate+'"]').length == 0){
                    console.log('append schedule with date', bookingDate);
                    scheduleList.append('<li data-book-date="'+bookingDate+'" data-schedule-no="'+scheduleNo+'">'+'<strong>'+movieName+'</strong></br>'+playDate+'  |  '+playTime+'</li>');
                    //on select schedule
                    scheduleList.children().last().off('click focusReservation').on('click focusReservation',function(e){
                        $(this).addClass('selected');
                        //hide all descendant list element
                        bookList.children().hide();
                        infoList.children().hide();
                        //deselect all sibling
                        $(this).siblings().removeClass('selected');
                        bookList.children().removeClass('selected');
                        //show specific reservation by schedule
                        let selectSchedule = $(this).data('scheduleNo');
                        bookList.find('li[data-schedule-no="'+selectSchedule+'"]').show();
                        if(e.type=='focusReservation'){
                            let thisElemOffsetFromTop = $(this)[0].offsetTop;
                            scheduleList[0].scrollTop = thisElemOffsetFromTop;
                        }
                    });
                }
                
                //append reservation
                let reservationNo = reservation[0].ReservationNo;
                bookList.append('<li data-book-date="'+bookingDate+'" data-schedule-no="'+scheduleNo+'" data-reservation-no="'+reservationNo+'">'+'<strong>Reservation No.: </strong>'+reservationNo+'</li>');
                totalReservation++;
                //on select reservation
                bookList.children().last().off('click focusReservation').on('click focusReservation',function(e){
                    $(this).addClass('selected');
                    //deselect all sibling
                    $(this).siblings().removeClass('selected');
                    //hide all descendant list element
                    infoList.children().hide();
                    //show specific info by reservationNo
                    let selectReservation = $(this).data('reservationNo');
                    infoList.find('li[data-reservation-no="'+selectReservation+'"]').show();
                    if(e.type=='focusReservation'){
                        let thisElemOffsetFromTop = $(this)[0].offsetTop;
                        bookList[0].scrollTop = thisElemOffsetFromTop;
                    }
                });

                //transform reservation to seatclass wise
                let byClass = {}
                reservation.forEach((seat)=>{
                    let seatClass = seat.SeatClass;
                    if(typeof byClass[seatClass] == 'undefined') byClass[seatClass] = []
                    byClass[seatClass].push(seat.SeatCode);
                });

                //append reservation info
                let data = {
                    data: {
                        bookDate: bookingDate,
                        scheduleNo: scheduleNo,
                        reservationNo: reservationNo,
                        MovieName: movieName,
                        PosterURL: reservation[0].PosterURL,
                        PlayTime: playTime,
                        PlayDate: playDate,
                        TheatreName: reservation[0].TheatreCode,
                        Branch: reservation[0].BranchName,
                        Audio: reservation[0].Audio,
                        Genre: reservation[0].Genre,
                        Rate: reservation[0].Rate,
                        Dimension: reservation[0].Dimension,
                        SeatList: byClass
                    }
                };
                let html = new EJS({url:'/client-templates/ticket-info'}).render(data);
                infoList.append(html);
            });

            //render total reservation
            $("#user-ticket-no-reserve").text(totalReservation);
            
        });

        scheduleList.children().hide();
        bookList.children().hide();
        infoList.children().hide();
        $(document).trigger('fetchReservationComplete');
        //hide all descendant list element by default
        
    }

    updateUIByAuth = () => {
        if(this.isAuth) {
            $('#head-login-btn').hide();
            $('#head-user-badge').show();
            if(this.role==='admin'){
                $('#toAdmin-btn').show();
            }
            console.log(this.userData);
            let middleName = '';
            if(this.userData.MidName!=null) middleName = this.userData.MidName;
            let fullName = this.userData.FirstName.capitalize()
                            +' '+ middleName.capitalize()
                            +' '+ this.userData.LastName.capitalize();
            $('.fetch.userFullName').text(fullName);
            $('.fetch.userEmail').text(this.userData.Email);
            $('.fetch.username').text(this.userData.username);
            $('.fetch.userpic').attr('src',this.userData.ImageURL);

            //profile page
            let profile = $('#profile-view form');
            profile.find('#fname').val(this.userData.FirstName);
            profile.find('#mname').val(this.userData.MidName);
            profile.find('#lname').val(this.userData.LastName);
            profile.find('#citizen').val(this.userData.FirstName);
            profile.find('#bdate').val(this.userData.FirstName);
            profile.find('.pf-gender option[value="'+this.userData.Gender+'"]').prop('selected', true)
            profile.find('#email').val(this.userData.Email);
            profile.find('#phone').val(this.userData.PhoneNumber);
            profile.find('#addr').val(this.userData.Address);
            profile.find('#uname').val(this.userData.username);

            profile.find('#pf-cancel').off('click').click(function(e){
                e.preventDefault();
                profile.find('input, textarea').prop('readonly', true);
                profile.find('select').attr('disabled', true);
                profile.find('.psw-group, .send-group').hide();
                profile.find('.psw-group #psw, .send-group').prop('readonly', true);
            });

            profile.find('input').off('click').click(function(e){
                if($(this).prop('readonly')||$(this).attr('disabled')){
                    $(this).prop('readonly', false);
                    $(this).attr('disabled', false);

                    profile.find('.psw-group, .send-group').show();
                    profile.find('.psw-group #psw, .send-group').prop('readonly', false);


                }
            })
        };
    }

    renderMoviesGrid = (targetRow=null, mode=undefined) => {
        let i = 0;
        targetRow.empty();
        this.showingList.forEach(movie => {
            let data = {
                data: movie, 
                onclick: 'selectMovie('+ i + (mode=='index-row'?',this':'') + ")",
                mode: mode};
            let html = new EJS({url:'/client-templates/movie-poster'}).render(data);
            if(targetRow!=null) targetRow.append(html);
            i++;
        });
        $('.nshowing').text(targetRow.children().length);
    }
    
    renderList = (listData, target=null) => {
        listData.forEach(list => {
            target.empty();
            target.find('.list').append('<li></li>')
        })
    }

}


