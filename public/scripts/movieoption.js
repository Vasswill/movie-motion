var CouponTemp = [];
$(this).addClass('selected').siblings().removeClass('selected');

$(document).on("click","#callDeleteCouponForm",function(e){e.stopPropagation();});
$(document).on("click","#showMovieCoupon",function(e){e.stopPropagation();});
$(document).on("click","#showBranchCoupon",function(e){e.stopPropagation();});

function callCouponForm(err,CouponCode = null) {
    
    //Theatre = [{Name:'Add New Theatre',Branch:'NULL',Detail:{Type:'Create',Old:''}}];
    //reRenderTHTable();
    //PlanHeight=0;PlanWidth=0;OpSeatCount=1;Thcount=0;nowTH=0;renderCount = [1,1,1,1];
    var date = new Date();
    //console.log(date.toISOString().slice(0,10));
    $('#CouponCode').val('');
    document.getElementById("DiscountRate").value = 0;
    document.getElementById("MaxDiscount").value = 0;
    $('#ExpireDate').val(date.toISOString().slice(0,10));
    document.getElementById("MinAge").value = 0;
    document.getElementById("MaxAge").value = 0;
    document.getElementById("MinSeat").value = 0;
    document.getElementById("MinSpend").value = 0;
    document.getElementById("Number").value = 0;
    
    $('#couponForm').show();
    $('.content-view').hide();
    if(CouponCode){
        LoadDataEditCouponForm(CouponCode);
        oldCouponCode = CouponCode;
        console.log('xxx');
        console.log(CouponCode);
    }
}
$(document).on("click","#addCoupon", callCouponForm);

function sentCouponForm(data) {
    console.log(data);
    if(data.Coupon.CouponCode!='' && 
    data.Coupon.CouponCode.length<16 &&
    data.Coupon.CouponCode == data.Coupon.CouponCode.toUpperCase() &&
    data.Coupon.DiscountRate>=0 && 
    data.Coupon.DiscountRate<=100 && 
    data.Coupon.ExpireDate!='' &&
    data.Coupon.MinAge<data.Coupon.MaxAge && 
    data.Coupon.MinAge>=0 &&
    data.Coupon.MaxAge>0 &&
    data.Coupon.MinSeat>=0 &&
    typeof data.Coupon.MinSeat == "number" &&
    data.Coupon.MinSpend>=0 &&
    data.Coupon.Number>=0 &&
    typeof data.Coupon.Number == "number" &&
    data.Coupon.MaxDiscount>0 &&
    data.MovieInput.length>0 &&
    data.BranchInput.length>0) {
    
    console.log('Valid');
    $.post('/coupon',data,(res)=>{
        iziToast.destroy();
        iziToast.show({
            position: "topCenter", 
            icon: "far fa-thumbs-up",
            title: 'Save!', 
            color: 'green',
            timeout: 2000,
            message: 'You Coupon is save successfully.',
        });
    });
    cancelCoupon();
    pageRedirect();
}else{
    console.log(data.Coupon.CouponCode!='' );
    console.log(data.Coupon.CouponCode.length );
    console.log(data.Coupon.CouponCode == data.Coupon.CouponCode.toUpperCase() );
    console.log(data.Coupon.DiscountRate>0 );
    console.log(data.Coupon.DiscountRate<100 );
    console.log(data.Coupon.ExpireDate!='') ;
    console.log(data.Coupon.MinAge<data.Coupon.MaxAge );
    console.log(data.Coupon.MinSeat>0 );
    console.log(typeof data.Coupon.MinSeat == "number") ;
    console.log(data.Coupon.MinSpend>0);
    console.log(data.Coupon.Number>0 );
    console.log(typeof data.Coupon.Number == "number" );
    console.log(data.Coupon.MaxDiscount>0);
    console.log(data.MovieInput.length);
    console.log(data.BranchInput.length);
    console.log('Not Valid');
    iziToast.destroy();
        iziToast.show({
            position: "topCenter", 
            icon: "fas fa-exclamation-triangle",
            title: 'Warning!', 
            color: 'orange',
            timeout: 2000,
            message: 'You should check input in on some of those fields below.',
        });
}

}

function quizFrom() {
    cancelCoupon();
    pageRedirect();
}

function cancelCoupon() {
    $('.content-view').show();
    $('.content-form').hide();
    $('#listCouponTable').find('tr').remove();
    getCouponList();
}

function toggle(source) {
    checkboxes = document.getElementsByName('movieInput');
    for(var i=0, n=checkboxes.length;i<n;i++) {
      checkboxes[i].checked = source.checked;
    }
  }

function addListMovieTable(data) {
    data.forEach((value, key) => {
        var tableRowappend = '<li><label><input class="form-check-input" type="checkbox" name="movieInput" value = "'+value.MovieNo+'"/><div>'+value.MovieName+'</div></label></li>'
        $("#listMovieTable").append(tableRowappend);
    });
}

function getMovieList(){
    $.get('/fetchData/movie/none',(data)=>{
            addListMovieTable(data);
    });
}
getMovieList();

function toggle1(source) {
    //console.log(source.checked);
    checkboxes = document.getElementsByName('branchInput');
    for(var i=0, n=checkboxes.length;i<n;i++) {
      checkboxes[i].checked = source.checked;
    }
  }

function addBranchList(){
    $.get('/fetchData/branch/none',(data)=>{
            data.forEach((value,key)=>{
            $("#TheatreBranchTable").append('<li><label><input class="form-check-input" type="checkbox" name="branchInput" value = "'+value.BranchNo+'" /><div>'+value.BranchName+'</div></label></li>');
        })
    });
}
addBranchList();

function addListCouponTable(data) {
    data.forEach((value, key) => {
        var tableRowappend = "<li class='couponTable'>"+value.CouponCode+"</li>"
        $("#listCouponTable").append(tableRowappend);
    });
}

function getCouponList(){
    $.get('/fetchData/coupon/none',(data)=>{
            addListCouponTable(data);
    });
}
getCouponList();

$.get('/fetchData/coupon/none',(data)=>{
    CouponTemp = data;
    console.log(CouponTemp);
});

$(document).on("click",".couponTable",function (event){
    event.stopPropagation();
    $('#viewCouponCode').text('');
    $('#viewDiscountRate').text("Discount Rate :  %");
    $('#viewMaxDiscount').text("Max Discount :  Baht");
    $('#viewMinAge').text("Min Age :  Year");
    $('#viewMaxAge').text("Max Age :  Year");
    $('#viewMinSeat').text("Min Seat :  ");
    $('#viewMinSpend').text("Min Spend :  Baht");
    $('#viewExpireDate').text("Expire Date :  ");
    $('#viewNumberAvialable').text("NumberAvialable :  ");
    $('#fromBottom').show();
    $('#detailCoupon').show();
    $(this).addClass('selected').siblings().removeClass('selected');
    $('#viewCouponCode').text(CouponTemp.find(item => item.CouponCode === this.innerHTML).CouponCode);
    $('#viewDiscountRate').text("Discount Rate : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).Discount*100+" %");
    $('#viewMaxDiscount').text("Max Discount : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).MaxDiscount+" Baht");
    $('#viewMinAge').text("Min Age : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).MinAge+" Year");
    $('#viewMaxAge').text("Max Age : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).MaxAge+" Year");
    $('#viewMinSeat').text("Min Seat : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).MinSeat+" ");
    $('#viewMinSpend').text("Min Spend : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).MinSpend+" Baht");
    $('#viewExpireDate').text("Expire Date : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).EXPDate.slice(0, 10)+" ");
    $('#viewNumberAvialable').text("NumberAvialable : "+CouponTemp.find(item => item.CouponCode === this.innerHTML).NoAvailable+" ");
    getCouponBranchList(CouponTemp.find(item => item.CouponCode === this.innerHTML).CouponCode);
    getCouponMovieList(CouponTemp.find(item => item.CouponCode === this.innerHTML).CouponCode);
});

//---------------------Popup------------------//
function addListCouponBranchTable(data) {
    //console.log(data);
    $("#listCouponBranchTable").text('');
    for(var i=0, n=data.length;i<n;i++) {
        $.get('/fetchData/branch/BranchNo='+data[i].BranchNo,(data)=>{
            //console.log(data[0].BranchName);
            var tableRowappend = "<li class='couponBranchTable'>"+data[0].BranchName+"</li>"
            $("#listCouponBranchTable").append(tableRowappend);
        });
      }
}

function getCouponBranchList(data){
    var CouponCode = data;
    $.get('/fetchData/coupon_branch/CouponCode='+CouponCode,(data)=>{
            addListCouponBranchTable(data);
    });
}
//getCouponBranchList();

function addListCouponMovieTable(data) {
    //console.log(data);
    $("#listCouponMovieTable").text('');
    for(var i=0, n=data.length;i<n;i++) {
        $.get('/fetchData/movie/MovieNo='+data[i].MovieNo,(data)=>{
            //console.log(data[0].BranchName);
            var tableRowappend = "<li class='couponBranchTable'>"+data[0].MovieName+"</li>"
            $("#listCouponMovieTable").append(tableRowappend);
        });
      }
}

function getCouponMovieList(data){
    var CouponCode = data;
    $.get('/fetchData/coupon_movie/CouponCode='+CouponCode,(data)=>{
            addListCouponMovieTable(data);
    });
}
//getCouponMovieList();
//---------------------Delete-----------------//
$(document).on("click","#callDeleteCouponForm",function(e){e.stopPropagation();});

$(document).on("click","#confirmDeleteCoupon",function(event){
    event.stopPropagation();
    var deleteCoupon = $('#viewCouponCode').text();
    $.get('/coupon/delete/'+deleteCoupon,(res)=>{
        
    });
    console.log("Delete");
    pageRedirect();
});

//---------------------Update-----------------//
$(document).on("click","#callEditCouponForm",function(event){
    callCouponForm(event,$('#viewCouponCode').text());
});

function LoadDataEditCouponForm(CouponCode){
    $.get('/fetchData/coupon/CouponCode='+CouponCode,(data)=>{
        //while(OpSeatCount>2){removeSeat();}
        //clearSeat(1);
        var getdata = data[0];
        console.log(data);
        if(getdata){
            $('#CouponCode').val(getdata.CouponCode);
            document.getElementById("DiscountRate").value = getdata.Discount*100;
            document.getElementById("MaxDiscount").value = getdata.MaxDiscount;
            $('#ExpireDate').val(getdata.EXPDate.slice(0, 10));
            document.getElementById("MinAge").value = getdata.MinAge;
            document.getElementById("MaxAge").value = getdata.MaxAge;
            document.getElementById("MinSeat").value = getdata.MinSeat;
            document.getElementById("MinSpend").value = getdata.MinSpend;
            document.getElementById("Number").value = getdata.NoAvailable;
        }
    });

    $.get('/fetchData/coupon_branch/CouponCode='+CouponCode,(data)=>{
        //console.log(data);
        checkboxes = document.getElementsByName('branchInput');
        for(var i=0, n=checkboxes.length;i<n;i++) {
            if(checkboxes[i].value == data[i].BranchNo){
                checkboxes[i].checked = true;
            }
        }
    });

    $.get('/fetchData/coupon_movie/CouponCode='+CouponCode,(data)=>{
        //console.log(data);
        checkboxes = document.getElementsByName('movieInput');
        for(var i=0, n=checkboxes.length;i<n;i++) {
            if(checkboxes[i].value == data[i].MovieNo){
                checkboxes[i].checked = true;
            }
        }
    });
}

function SelectedAddEdit(){
    var selectedMovies = $('[name=movieInput]:checked').map(function() {
        return this.value;
    }).get();

    var selectedBranchs = $('[name=branchInput]:checked').map(function() {
    return this.value;
    }).get();
    
    var payload = {
        Coupon: {CouponCode: $('#CouponCode').val(),
        DiscountRate: parseInt($('#DiscountRate').val()),
        MaxDiscount: parseFloat($('#MaxDiscount').val()),
        ExpireDate: $('#ExpireDate').val(),
        MinAge: parseInt($('#MinAge').val()),
        MaxAge: parseInt($('#MaxAge').val()),
        MinSeat: parseInt($('#MinSeat').val()),
        MinSpend: parseFloat($('#MinSpend').val()),
        Number: parseInt($('#Number').val())
    }, MovieInput: [...selectedMovies],
    BranchInput: [...selectedBranchs]
    };
    //console.log(payload);
    $.get('/fetchData/coupon/none',(data)=>{
        var code = [];
        for(var i=0, n=data.length;i<n;i++) {
            code.push(data[i].CouponCode);
          }
        if(code.indexOf(payload.Coupon.CouponCode) > -1 == false){
            console.log('add');
            sentCouponForm(payload)
        }else{
            console.log('update');
            EditCoupon(payload);
        }
          
    });
    //sentCouponForm(payload);
}

function EditCoupon(data){
    console.log(data);
    if(data.Coupon.CouponCode!='' && 
    data.Coupon.CouponCode.length<16 &&
    data.Coupon.CouponCode == data.Coupon.CouponCode.toUpperCase() &&
    data.Coupon.DiscountRate>=0 && 
    data.Coupon.DiscountRate<=100 && 
    data.Coupon.ExpireDate!='' &&
    data.Coupon.MinAge<data.Coupon.MaxAge && 
    data.Coupon.MinAge>=0 &&
    data.Coupon.MaxAge>0 &&
    data.Coupon.MinSeat>=0 &&
    typeof data.Coupon.MinSeat == "number" &&
    data.Coupon.MinSpend>=0 &&
    data.Coupon.Number>=0 &&
    typeof data.Coupon.Number == "number" &&
    data.Coupon.MaxDiscount>0 &&
    data.MovieInput.length>0 &&
    data.BranchInput.length>0) {
    
    console.log('Valid Update');
    $.get('/coupon/delete/'+data.Coupon.CouponCode,(res)=>{
        $.post('/coupon',data,(res)=>{
        
        });
        cancelCoupon();
        pageRedirect();
    });
    
}else{
    console.log(data.Coupon.CouponCode!='' );
    console.log(data.Coupon.CouponCode.length );
    console.log(data.Coupon.CouponCode == data.Coupon.CouponCode.toUpperCase() );
    console.log(data.Coupon.DiscountRate>0 );
    console.log(data.Coupon.DiscountRate<100 );
    console.log(data.Coupon.ExpireDate!='') ;
    console.log(data.Coupon.MinAge<data.Coupon.MaxAge );
    console.log(data.Coupon.MinSeat>0 );
    console.log(typeof data.Coupon.MinSeat == "number") ;
    console.log(data.Coupon.MinSpend>0);
    console.log(data.Coupon.Number>0 );
    console.log(typeof data.Coupon.Number == "number" );
    console.log(data.Coupon.MaxDiscount>0);
    console.log(data.MovieInput.length);
    console.log(data.BranchInput.length);
    console.log('Not Valid');
    iziToast.destroy();
        iziToast.show({
            position: "topCenter", 
            icon: "fas fa-exclamation-triangle",
            title: 'Warning!', 
            color: 'orange',
            timeout: 2000,
            message: 'You should check input in on some of those fields below.',
        });
    }
}