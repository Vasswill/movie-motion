let nowShowing = undefined;
let webState = undefined;
$(document).ready(function(){
    webState = new webstate(auth);
    if(typeof data != 'undefined'){
        if(typeof data.reservationSuccess != 'undefined'&&typeof data.reservationSuccess.reservationNo != 'undefined'&&typeof data.reservationSuccess.scheduleNo != 'undefined'){
            webState.temp.focusReservation = data.reservationSuccess;
            
            //get openlist element
            let datebookList = $('#user-ticket-datebook');
            let scheduleList = $('#user-ticket-schedule');
            let bookList = $('#user-ticket-reservation');
            let infoList = $('#user-ticket-detail');
            
            var toast = document.querySelector('.fetchToast'); // Selector of your toast
            iziToast.hide({}, toast);
            
            iziToast.show({
                title: 'Success! ',
                class: 'ticketSuccess',
                icon: 'fas fa-calendar-check',
                message: 'Ticket Reservation Success! Loading Your Ticket Info.',
                position: 'topCenter',
                color: 'green',
                overlay: true,
                timeout: false,
                close: false
            });

            $(document).on('fetchReservationComplete', function(){
                //close toast
                var toast = document.querySelector('.ticketSuccess'); // Selector of your toast
                iziToast.hide({}, toast);
                //show my reservation by focus at the reservationNo
                $('.web-body').removeClass('overlay');
                $('#user-ticket').trigger('init').show();
                //focusing
                let bookdateOfTarget = bookList.find('li[data-reservation-no="'+webState.temp.focusReservation.reservationNo+'"]').data('bookDate');
                datebookList.find('li[data-book-date="'+bookdateOfTarget+'"]').trigger('focusReservation');
                scheduleList.find('li[data-schedule-no="'+webState.temp.focusReservation.scheduleNo+'"]').trigger('focusReservation');
                bookList.find('li[data-reservation-no="'+webState.temp.focusReservation.reservationNo+'"]').trigger('focusReservation');
                
                //show prompt
                iziToast.show({
                    title: 'Cha-ching!~ ',
                    class: 'ticketSuccess',
                    icon: 'fas fa-ticket-alt',
                    message: 'This Is Your Reservation',
                    position: 'topCenter',
                    color: 'green',
                    displayMode: 1,
                    timeout: 10000,
                    close: false
                });

                $(document).off('fetchReservationComplete');
            });
            
        }
    }
    // if(typeof webState.role != 'undefined'){
    //     if(webState.role )
    // }
});

$(document).on("keydown", "form.preventEnter", function(event) { 
    return event.key != "Enter";
    //prevent hitting enter in form
});

$('.popup-area, #popup-close, .close-key').click(function(e){
    if(e.target != this && e.target != this.children[0]) return;
    $('.web-body').removeClass('overlay');
    $(this).closest('.popup-area').hide();
});

$('.web-body').on('popup-closeAll', function(){
    $('.web-body').removeClass('overlay');
    $('.popup-area').hide();
});

$('button, .side-bar-icon, a').click(function(){
    let popupId = $(this).data('popup');
    if(popupId){
        if(popupId=='buy-ticket-popup'&&webState.role == 'admin'){
            iziToast.show({
                position: "topCenter", 
                icon: 'fas fa-ban',
                title: 'Prohibited!', 
                color: 'yellow',
                message: 'Admin can\'t book a seat',
                close: false
            });
            return;
        }
        $('.web-body').addClass('overlay');
        $('#'+popupId).trigger('init').show();
    }
})

$('.logo').dblclick(function(){
    $('.content-box').toggleClass('special-mode');
});

$('button').on('reset', function(e, isDisable=true, moreClass=undefined){
    if($(this).data('default-disable')&&isDisable) $(this).prop("disabled", true);
    if(typeof $(this).data('default-class') != 'undefined'||moreClass) $(this).attr( "class", $(this).data('default-class')+' '+(moreClass?moreClass:''));
    if(typeof $(this).data('default-txt') != 'undefined') $(this).find('span').text($(this).data('default-txt'));
});

$(document).on("click", "#signup",function () {
    $("#login-popup > div").closest('.popup-area').hide();
});

$(document).on("click", "#NextRegForm",function () {
    $.get('/fetchData/users/Username='+$('#RegisterUserName').val(),(data)=>{
        if(data.length==0){
            $('#LoginPart').hide();
            $('#CustomerDeatail').show();
        }
        else{
            iziToast.show({
                position: "topCenter", 
                icon: "fas fa-exclamation-triangle",
                title: 'Warning!', 
                color: 'orange',
                timeout: 2000,
                message: 'This Username is already used',
            });
        }
    });
});

$(document).on("click", "#BackRegForm",function () {
    $('#LoginPart').show();
    $('#CustomerDeatail').hide();
});

$(document).ready(function() {
    $('#NextRegForm').prop('disabled', true);
    $('#RegisterPassword').keyup(function() {
       if(($('#RegisterPassword').val() == $('#RegisterConPassword').val())&&($('#RegisterUserName').val())) {
          $('#NextRegForm').prop('disabled', false);
       }
       else $('#NextRegForm').prop('disabled', true);
    });
    $('#RegisterConPassword').keyup(function() {
        if(($('#RegisterPassword').val() == $('#RegisterConPassword').val())&&($('#RegisterUserName').val())) {
           $('#NextRegForm').prop('disabled', false);
        }
        else $('#NextRegForm').prop('disabled', true);
     });
     $('#RegisterUserName').keyup(function() {
        if(($('#RegisterPassword').val() == $('#RegisterConPassword').val())&&($('#RegisterUserName').val())) {
           $('#NextRegForm').prop('disabled', false);
        }
        else $('#NextRegForm').prop('disabled', true);
     });
});

$(document).on("click","#SubRegForm", function () {
    var Notfound=['<strong>'];
    iziToast.show({
        position: "topCenter", 
        iconUrl: '/assets/images/load_placeholder.svg',
        title: 'Saving Data', 
        color: 'blue',
        message: 'Please Wait',
        timeout: false,
        overlay: true,
        close: false
    });
    payload = {
        user : {
            username : $('#RegisterUserName').val(),
            password : $('#RegisterPassword').val(),
        },
        Detail : {
            firstname : $('#RegisterFirstName').val(),
            midname : $('#RegisterMidName').val(),
            lastname : $('#RegisterLastName').val(),
            birthday : $('#RegisterBirthDay').val(),
            gender : $('#RegisterGender').val(),
            C_PId : $('#RegisterCID').val(),
            phone : $('#RegisterPhone').val(),
            img : $('#RegisterIMG').val(),
            address : $('#RegisterAddress').val(),
            email : $('#RegisterEmail').val(),
        }
    }
    //console.log(payload);
    const entries = Object.entries(payload.Detail)
    for (const [key,value] of entries) {
        //console.log(key,value,(value)=="")
        if((value)==""){
            Notfound.push(key);
        }
    }
    if(Notfound.length==1){
        $.get('/fetchData/customer/Email='+payload.Detail.email,(data)=>{
            if(data.length==0){
                $.post('/register',payload,(res)=>{
                    iziToast.destroy();
                    iziToast.show({
                        position: "topCenter", 
                        icon: "far fa-thumbs-up",
                        title: 'Save!', 
                        color: 'green',
                        timeout: 2000,
                        message: 'Register successfully.'
                    });
                    window.location.href = "/";
                });
            }
            else{
                iziToast.destroy();
                iziToast.show({
                    position: "topCenter", 
                    icon: "fas fa-exclamation-triangle",
                    title: 'Warning!', 
                    color: 'orange',
                    timeout: 2000,
                    message: 'This Email is already used',
                });
            }
        });
    }
    else{
        Notfound.push('</strong>');
        var show = 'You should check input in on some of those fields below. </br>'+Notfound.toString();
        show = show.replace("C_PId","Citizen/Passport ID");
        show = show.replace("img","image");
        show = show.replace(/,/g,"&emsp13;");
        iziToast.destroy();
        iziToast.show({
            position: "topCenter", 
            icon: "fas fa-exclamation-triangle",
            title: 'Warning!', 
            color: 'orange',
            timeout: 10000,
            message: show
        });
    }
});