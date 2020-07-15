var Theatre = [{Name:'Add New Theatre',Branch:'NULL',Detail:{Type:'Create',Old:''}}];
var Plandata = [];
var oldBranchName=null, noweditP;
var SeatClass,PlanHeight=0,PlanWidth=0;
var OpSeatCount=1
    Thcount=0
    nowTH=0;
var renderCount = [1,1,1,1];
var Theatredata = [];

//-------------------------------------Theatre Function--------------------------------------------

function addTable(data) {
    data.forEach((value, key) => {
        var tableRowappend = '<tr id="Th'+Thcount+'" class="default-mouse" ><th onclick="editTh('+Thcount+')" class="text-white pl-3" scope="col">'+value.Name+'</th>'
        if(Thcount>0) tableRowappend += '<th class="text-white" onclick="removeTh('+Thcount+')" scope="col">X</th>';
        else tableRowappend += '<th onclick="editTh(0)"></th>';
        tableRowappend += '</tr>';
        Thcount++;
        if(value.Detail.Type!='Delete')$("#MyTableTr").append(tableRowappend);
    });
    $('#Th'+nowTH).addClass('bg-secondary').siblings().removeClass('bg-secondary');
}

function reRenderTHTable(){
    $('.alert').hide()
    for(var i = Thcount-1 ; i >= 0 ; i--) {
        $('#Th'+i).remove();
        Thcount--;
    }
    addTable(Theatre);
}

function removeTh(id){
    var THName = $('#Th'+id)[0].childNodes[0].innerHTML;
    switch(Theatre[id].Detail.Type){
        case 'Create' : Theatre.splice(Theatre.findIndex((val)=>{return val.Name==THName}),1); break;
        case 'Load' : Theatre[id].Detail = {Type: 'Delete',Old: Theatre[id].Name}; break;
        case 'Update' : Theatre[id].Detail.Type = 'Delete'; break;
    }
    $('#NameTheatre').val('');
    $('#TheatreBranch').val('');
    reRenderTHTable();
    nowTH = 0;
}

function editTh(id){
    $('#Th'+id).addClass('bg-secondary').siblings().removeClass('bg-secondary');
    noweditP = Theatre[id].Name;
    if(id>0){
        $('#NameTheatre').val(Theatre[id].Name);
        $('#TheatreBranch').val(Theatre[id].Branch);
    }
    else $('#NameTheatre').val('');
    nowTH=id;
}

function saveTheatre(){
    iziToast.show({
        position: "bottomLeft", 
        iconUrl: '/assets/images/load_placeholder.svg',
        title: 'Saving Theatre', 
        color: 'blue',
        message: 'Please Wait',
        timeout: false,
    });
    var data = {Name:$('#NameTheatre').val(), Branch:$('#TheatreBranch').val(),Detail:{Type:'Create',Old:''}}
    if(data.Name!='' && data.Branch){
        $.get('/fetchData/theatre/TheatreCode='+data.Name,(getdata)=>{
            if(getdata.length==0&&!(Theatre.find((val)=>{ return val.Name==data.Name}))||(noweditP==data.Name)){
                $('#NameTheatre').val('');
                if(nowTH==0){
                    addTable([data]);
                    Theatre.push(data);
                }
                else {
                    switch (Theatre[nowTH].Detail.Type){
                        case 'Load': data.Detail = {Type:'Update',Old:Theatre[nowTH].Name}; break;
                        case 'Update' : data.Detail = Theatre[nowTH].Detail; break;
                        default : break;
                    }
                    Theatre[nowTH] = data;
                    reRenderTHTable();
                }
                iziToast.destroy();
                iziToast.show({
                    icon: "far fa-thumbs-up",
                    title: 'Save!', 
                    color: 'green',
                    position: 'bottomLeft',
                    timeout: 2000,
                    message: 'You Theatre is save successfully.',
                });
            }
            else{
                iziToast.destroy();
                iziToast.show({
                    position: "bottomLeft", 
                    icon: "fas fa-exclamation-triangle",
                    title: 'Warning!', 
                    color: 'orange',
                    timeout: 2000,
                    message: 'This TheatreName is already used',
                });
            }
        });
        
        
    }
    else {
        iziToast.show({
            icon: "fas fa-exclamation-circle",
            title: 'Warning!', 
            color: 'red',
            position: 'bottomLeft',
            timeout: 2000,
            message: 'You should check input in on some of those fields below.',
        });
    }
}

function addBranchOption(){
    $.get('/fetchData/branch/none',(data)=>{
            data.forEach((value,key)=>{
            $("#TheatreBranch").append('<option class="form-control-plaintext" value="'+value.BranchNo+'">'+value.BranchName+'</option>');
        })
    });
}

//-------------------------------------Plan Function--------------------------------------------

function planH(){
    PlanHeight = parseFloat(document.getElementById("PlanHeight").value);
    if(PlanHeight<0) PlanHeight = 0;
    $('#showH')[0].childNodes[0].data = 'Plan Height '+PlanHeight+' m.';
    document.getElementById("PlanHeight").value = PlanHeight;
}

function planW(){
    PlanWidth = parseFloat(document.getElementById("PlanWidth").value);
    if(PlanWidth>30) PlanWidth = 30;
    else if(PlanWidth<0) PlanWidth = 0;
    $('#showW')[0].childNodes[0].data = 'Plan Width '+PlanWidth+' m.';
    document.getElementById("PlanWidth").value = PlanWidth;
    reRenderSeat();
}

function appendSeatClass(number) {
    SeatClass.forEach((value,key)=>{
        $("#SeatClass"+number).append('<option class="form-control-plaintext" value="'+value.ClassName+'">'+value.ClassName+'</option>');
    });   
}

function getSeatClass(){
    $.get('/fetchData/seatclass/none',(data)=>{
            SeatClass = data;
            appendSeatClass(1);
            iziToast.destroy();
            addListSeatClassTable(SeatClass);
    });
}

function addSeat() {
    if(OpSeatCount<=4){
        let data = {
            OpSeatCount: OpSeatCount,
        };
        let html = new EJS({url:'/client-templates/seat-form'}).render(data);
        $("#adj").append(html);
        // $("#adj").append('<div id="SeatForm'+OpSeatCount+'" class="form-group row mb-0"><label for="SeatClass'+OpSeatCount+'" class="col-md-2 mt-2 mb-0" style="display:flex;justify-content:left;padding-left: 13px;"><span class="badge head-text-badge">Seat Class '+OpSeatCount+'</span></label><div class="col-md-3 col-sm-3 col-3"><select name="SeatClass'+OpSeatCount+'" id="SeatClass'+OpSeatCount+'" onchange="reRenderSeat()" class="form-control-plaintext text-white"></select></div><label for="NoRow'+OpSeatCount+'" class="col-md-2 col-sm-3 col-3 mt-2 mb-0">No.Row</label><div class="col-md-3 col-sm-3 col-3" style="min-width: 110px;"><button type="button" onclick="deleteSeatTH('+OpSeatCount+')" class="btn text-center text-white btn-white-rounded m-0 pl-2" style="width: 20px !important; min-width: 0px;" >-</button><input type="number" class="mt-2 custom-range text-white" readonly="readonly" style="text-align: center;width: 27px; border: 0px;" min="0" value="0" id="NoRow'+OpSeatCount+'" name="NoRow'+OpSeatCount+'"><button type="button" onclick="appendSeatTH('+OpSeatCount+')" class="btn text-center text-white btn-white-rounded m-0 pl-2" style="width: 24px !important; min-width: 0px;" >+</button></div><div></div></div>');
        if(OpSeatCount>1)appendSeatClass(OpSeatCount);
        OpSeatCount++;
    }
    return 1;
}

function removeSeat() {
    if(OpSeatCount>2) {
        clearSeat(--OpSeatCount);
        $('#SeatForm'+OpSeatCount).remove();
    }
}

function changeValR(op,num) {
    var value = parseFloat($('#NoRow'+num).val());
    if(op===1){
        $('#NoRow'+num).val(value+1);
    }
    else{
        $('#NoRow'+num).val(value-1);
    }
}

function appendSeatTH(num){
    var use=0,min=9999;
    if(SeatClass != null && PlanWidth>0){
        for(var i = 1; i < OpSeatCount; i++){
            var seatHeight = SeatClass.find((val)=>{ return val.ClassName==$('#SeatClass'+i).val()}).Height;
            //console.log(temp+"*"+(renderCount[i-1]-1));
            use += (seatHeight*(renderCount[i-1]-1));
        }
        var SeatClassData = SeatClass.find((val)=>{ return val.ClassName==$('#SeatClass'+num).val()});
        if(PlanHeight-use>=SeatClassData.Height && SeatClassData.Width<=PlanWidth){
            var seat = '<div id="render'+num+'R'+renderCount[num-1]+'" class="container-fluid pl-0 pr-0 mt-3 mb-3 d-flex justify-content-center" >'
            for (let i = 0; i < PlanWidth/SeatClassData.Width; i++) {
                seat += '<span class="dot ml-1 mr-1"></span>';
            }
            seat += '</div>'
            //console.log(seat);
            $('#render'+num).append(seat);
            renderCount[num-1]++;
            changeValR(1,num);
            let a = $('#render').offset().left + $('#render').width() / 2;
            $('#RenderHeight').scrollLeft(a);
        }
    }
    return 1;
}

function deleteSeatTH(num) {
    if(renderCount[num-1]>1){
        renderCount[num-1]--;
        $('#render'+num+'R'+renderCount[num-1]).remove();
        changeValR(0,num);
    }
}

function clearSeat(num) {
    while(renderCount[num-1]>1){
        deleteSeatTH(num);
    }
}

function reRenderSeat() {
    let tempCount = [...renderCount];
    for(var i=OpSeatCount; i>1; i--){
        clearSeat(i-1);
        for(var j=1; j<tempCount[i-2]; j++){
            appendSeatTH(i-1);
        }
    }
}

//-------------------------------------Plan Form Function--------------------------------------------

$(document).on("keypress", "form", function(event) { 
    return event.keyCode != 13;
});

function pageRedirect() {
    window.location.href = "/admin";
} 

function sentPlanForm() {
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
    var temp = [...Theatre];
    //temp.shift();
    var payload = {
        PlanName: $('#PlanName').val(),
        PlanHeight: PlanHeight,
        PlanWidth: PlanWidth,
        SeatClass1: $('#SeatClass1').val(),
        NoRow1: $('#NoRow1').val(),
        SeatClass2: $('#SeatClass2').val(),
        NoRow2: $('#NoRow2').val(),
        SeatClass3: $('#SeatClass3').val(),
        NoRow3: $('#NoRow3').val(),
        SeatClass4: $('#SeatClass4').val(),
        NoRow4: $('#NoRow4').val(),
        Theatre: temp.slice(1,temp.length)
    };
    var testP = {SeatClassData : [...SeatClass]};
    if(payload.PlanName!='' && PlanHeight>0 && PlanWidth>0 && payload.NoRow1>0){
        if(oldBranchName!=null&&payload.PlanName!=oldBranchName){
            $.get('/fetchData/plan/PlanName='+payload.PlanName,(data)=>{
                if(data.length==0){
                    var send = {newName:payload.PlanName,oldName:oldBranchName}
                    $.post('/plan/update',send,(res)=>{
                        $.post('/seatclass',testP,(res)=>{
                            //console.log(res);
                            $.post('/plan',payload,(res)=>{
                                iziToast.destroy();
                                iziToast.show({
                                    position: "topCenter", 
                                    icon: "far fa-thumbs-up",
                                    title: 'Save!', 
                                    color: 'green',
                                    timeout: 2000,
                                    message: 'You Plan is save successfully.',
                                });
                                cancelPlan();
                            });
                        });
                    })
                }
                else{
                    iziToast.destroy();
                    iziToast.show({
                        position: "topCenter", 
                        icon: "fas fa-exclamation-triangle",
                        title: 'Warning!', 
                        color: 'orange',
                        timeout: 2000,
                        message: 'This BranchName is already used',
                    });
                }
            });
        }
        else if(oldBranchName==null){
            $.get('/fetchData/plan/PlanName='+payload.PlanName,(data)=>{
                if(data.length==0){
                    $.post('/seatclass',testP,(res)=>{
                        console.log(res);
                        $.post('/plan',payload,(res)=>{
                            iziToast.destroy();
                            iziToast.show({
                                position: "topCenter", 
                                icon: "far fa-thumbs-up",
                                title: 'Save!', 
                                color: 'green',
                                timeout: 2000,
                                message: 'You Plan is save successfully.',
                            });
                            cancelPlan();
                        });
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
                        message: 'This BranchName is already used',
                    });
                }
            });
        }
        else{
            $.post('/seatclass',testP,(res)=>{
                //console.log(res);
                $.post('/plan',payload,(res)=>{
                    iziToast.destroy();
                    iziToast.show({
                        position: "topCenter", 
                        icon: "far fa-thumbs-up",
                        title: 'Save!', 
                        color: 'green',
                        timeout: 2000,
                        message: 'You Plan is save successfully.',
                    });
                    cancelPlan();
                })
            });
        }
                    
    } 
    else{
        iziToast.destroy();
        iziToast.show({
            position: "topCenter", 
            icon: "fas fa-exclamation-triangle",
            title: 'Warning!', 
            color: 'orange',
            timeout: 2000,
            message: 'You should check input in on some of those fields below.',
        });
        /*$('#plan-warning').fadeTo(2000, 500).slideUp(500, function(){
            $(this).hide(); 
        });*/
    }
}

function LoadDataEditForm(PlanName){
    $.get('/fetchData/plan/PlanName='+PlanName,(data)=>{
        while(OpSeatCount>2){removeSeat();}
        clearSeat(1);
        //console.log(data);
        var getdata = data[0];
        if(getdata){
            $('#PlanName').val(getdata.PlanName);
            document.getElementById("PlanHeight").value = getdata.PlanHeight;
            document.getElementById("PlanWidth").value = getdata.PlanWidth;
            planH();
            planW();
            getdata.SeatClass1&&$('#SeatClass1').val(getdata.SeatClass1)&&$('#NoRow1').val(getdata.NumberRow1)&&(renderCount[0]+=getdata.NumberRow1);
            getdata.SeatClass2&&addSeat()&&$('#SeatClass2').val(getdata.SeatClass2)&&$('#NoRow2').val(getdata.NumberRow2)&&(renderCount[1]+=getdata.NumberRow2);
            getdata.SeatClass3&&addSeat()&&$('#SeatClass3').val(getdata.SeatClass3)&&$('#NoRow3').val(getdata.NumberRow3)&&(renderCount[2]+=getdata.NumberRow3);
            getdata.SeatClass4&&addSeat()&&$('#SeatClass4').val(getdata.SeatClass4)&&$('#NoRow4').val(getdata.NumberRow4)&&(renderCount[3]+=getdata.NumberRow4);
            reRenderSeat();
        }
    });
    $.get('/fetchData/theatre/PlanName='+PlanName,(data)=>{
        //console.log(data);
        Theatre = [{Name:'Add New Theatre',Branch:'NULL',Detail:{Type:'Create',Old:''}}];
        data.forEach((value)=>{
            Theatre.push({Name: value.TheatreCode, Branch: ''+value.BranchNo+'', Detail:{Type:'Load',Old:''}});
        });
        reRenderTHTable();
    });
}

function cancelPlan() {
    getPlanList();
    getTheatreList();
    $('.content-view').show();
    $('.content-form').hide();
    $('#listPlanTable').find('li').remove();
    $("#listSeatClassTable").find('li').remove();
    $('#viewPlanName').text('');
    $('#viewPlanWidth').text("Width :  m.");
    $('#viewPlanHeight').text("Height :  m.");
    $('#NameTheatre').val('');
    $('#SelectPlanOrTheatre').val('Plan');
    oldBranchName=null;
}

function callPlanForm(event,PlanName = null) {
    /*iziToast.show({
        position: "topCenter", 
        iconUrl: '/assets/images/load_placeholder.svg',
        title: 'Fetch Data', 
        color: 'green',
        message: 'Please Wait',
        timeout: false,
        overlay: true,
        close: false
    });*/
    Theatre = [{Name:'Add New Theatre',Branch:'NULL',Detail:{Type:'Create',Old:''}}];
    reRenderTHTable();
    PlanHeight=0;PlanWidth=0;OpSeatCount=1;Thcount=0;nowTH=0;renderCount = [1,1,1,1];
    $('#PlanName').val('');
    document.getElementById("PlanHeight").value = 0;
    document.getElementById("PlanWidth").value = 0;
    planH();planW();
    $('#TheatreBranch').find('option').remove();
    $('.renderSeatPlan').find('div').remove();
    $('#Th0').remove();
    removeSeat();
    $('#adj').find('div').remove();
    $('#planForm').show();
    $('.content-view').hide();
    addSeat();
    addTable(Theatre);
    addBranchOption();
    getSeatClass();
    event.stopPropagation();
    if(PlanName){
        LoadDataEditForm(PlanName);
        oldBranchName = PlanName;
        //console.log(PlanName);
    }
}

$(document).on("click","#createPlan", callPlanForm);

$('#SelectPlanOrTheatre').on("change", function(e){
    e.stopPropagation();
    if(this.value != "Plan"){
        $(".planTable").hide();
        $(".planTheatre").show();
    }
    else{
        $(".planTable").show();
        $(".planTheatre").hide();
    }
});

function addListPlanTable(data,pRt) {
    data.forEach((value, key) => {
        //var tableRowappend = '<tr class="default-mouse planTable" ><th style="border:1px solid white;" class="text-white pl-3" scope="col">'+value.PlanName+'</th></tr>'
        var tableRowappend = "<li class='"+((pRt) ? "planTable" : "planTheatre")+"' value="+value.PlanName+">"+((pRt) ? value.PlanName : value.TheatreCode)+"</li>";
        $("#listPlanTable").append(tableRowappend);
    });
    //$('#Th'+nowTH).addClass('bg-secondary').siblings().removeClass('bg-secondary');
}

function reRenderSeatClassOption() {
    for(var i = OpSeatCount-1; i>0 ; i--){
        $("#SeatClass"+i).find('option').remove();
        appendSeatClass(i)
    }
}

function addNewSeat() {
    var SeatData = {
        ClassName : $("#SeatClassForm")[0][0].value,
        Couple: parseInt($('input[name=Couple]:checked', '#SeatClassForm').val()),
        FreeFood: parseInt($('input[name=FreeFood]:checked', '#SeatClassForm').val()),
        Height: parseFloat($("#SeatClassForm")[0][3].value)/100,
        Price: parseFloat($("#SeatClassForm")[0][1].value),
        Width: parseFloat($("#SeatClassForm")[0][2].value)/100,
        Detail: "Create"
    }
    if(SeatData.ClassName!=null&&!(SeatClass.find((val)=>{ return val.ClassName.toLowerCase()==SeatData.ClassName.toLowerCase()}))&&SeatData.Height>0&&SeatData.Width>0&&SeatData.Price>0){
        SeatClass.push(SeatData);
        $("#SeatClassForm")[0][0].value = '';
        $("#listSeatClassTable").find('li').remove();
        $("#SeatClassForm")[0][3].value=0;
        $("#SeatClassForm")[0][2].value=0;
        $("#SeatClassForm")[0][1].value=0;
        addListSeatClassTable(SeatClass);
        reRenderSeatClassOption()
    }
    else{
        iziToast.show({
            position: "topCenter", 
            icon: "fas fa-exclamation-triangle",
            title: 'Warning!', 
            color: 'orange',
            timeout: 2000,
            message: 'You should check input in on some of those fields below.',
        });
    }
    //console.log(SeatData);
}

function addListSeatClassTable(data) {
    //$("#listSeatClassTable").append("<li class='seatClassTable'>Add Seat Class</li>");
    data.forEach((value, key) => {
        //var tableRowappend = '<tr class="default-mouse planTable" ><th style="border:1px solid white;" class="text-white pl-3" scope="col">'+value.PlanName+'</th></tr>'
        var tableRowappend = "<li class='seatClassTable'>"+value.ClassName+"</li>";
        $("#listSeatClassTable").append(tableRowappend);
    });
}

$(document).on("click",".seatClassTable", function(){
    $(this).addClass('selected').siblings().removeClass('selected');
})


$(document).on("click",".planTheatre",function (event){
    event.stopPropagation();
    $('#viewPlanName').text('');
    $('#viewPlanWidth').text("Width :  m.");
    $('#viewPlanHeight').text("Height :  m.");
    $('#detailPlan').show();
    console.log(this.getAttribute("value"));
    $(this).addClass('selected').siblings().removeClass('selected');
    $('#viewPlanName').text(Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanName);
    $('#viewPlanWidth').text("Width : "+Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanWidth+" m.");
    $('#viewPlanHeight').text("Height : "+Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanHeight+" m.");
});


$(document).on("click",".planTable",function (event){
    event.stopPropagation();
    $('#viewPlanName').text('');
    $('#viewPlanWidth').text("Width :  m.");
    $('#viewPlanHeight').text("Height :  m.");
    $('#detailPlan').show();
    $(this).addClass('selected').siblings().removeClass('selected');
    $('#viewPlanName').text(Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanName);
    $('#viewPlanWidth').text("Width : "+Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanWidth+" m.");
    $('#viewPlanHeight').text("Height : "+Plandata.find(item => item.PlanName === this.getAttribute("value")).PlanHeight+" m.");
});

$(document).on("click","#callEditPlanForm",function(event){
    callPlanForm(event,$('#viewPlanName').text());
});


$(document).on("click","#callDeletePlanForm",function(e){e.stopPropagation();});
$(document).on("click","#popup-close",function(e){e.stopPropagation();});

$(document).on("click","#confirmDeletePlan",function(event){
    event.stopPropagation();
    var deletePlan = $('#viewPlanName').text();
    $.get('/plan/delete/'+deletePlan,(res)=>{
        pageRedirect();
    });
    //console.log("Delete");
});

$(document).on("click","#CreateSeatClass", addNewSeat)

function getPlanList(){
    $.get('/fetchData/plan/none',(data)=>{
            addListPlanTable(data,1);
            Plandata = data;
    });
}
function getTheatreList(){
    $.get('/fetchData/theatre/none',(data)=>{
            addListPlanTable(data,0);
            Theatredata = data;
            $(".planTheatre").hide();
    });
}
getPlanList();
getTheatreList();

$(window).click(function() {
    $('#fromBottom').hide();
    $('#detailCoupon').hide();
    $('#detailPlan').hide();
    $('.planTable').removeClass('selected bg-secondary');
    $('.planTheatre').removeClass('selected bg-secondary');
});