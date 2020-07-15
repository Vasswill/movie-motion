var theater;
var branchName;
var schedule_list =[];
var schedule_list_add =[];
var Schedule_select;
var test;
var Movies;
var MovieSchedule =[];
var MovieEdit;
var Branch =[];
var TheatreA =[];
$('.changeMovie').hide()
$(".DeleteSch").hide()
$(".AddSch").hide()

function ScheduleInfo(cl,data) {
    $("#Schedule").find('tr').remove();
    MovieSchedule.forEach((value,key)=>{
            if(cl==value.MovieNo){
                $("#Schedule").append('<tr data-st="'+value.ScheduleNo+'" class="scheduleTable"><td class="table-center">'+value.ScheduleNo+'</td><td class="table-center">'+value.MovieNo+'</td><td class="table-center">'+value.TheatreCode+'</td><td>'+new Date(value.Date).getDate()+'-'+(new Date(value.Date).getMonth()+1)+'-'+new Date(value.Date).getFullYear()+'</td><td>'+value.Time+'</td><td class="table-center">'+value.Audio+'</td><td class="table-center"><span class="badge head-text-badge">'+value.Dimension+'</span></td><td class="table-center">'+value.Subtitle+'</td></tr>'); 
            }
    });
    
}

function MovieInfo(cl,data) {
    $("#MovieInfo").find('li').remove();
    MovieSchedule.forEach((value,key)=>{
            if(cl==value.MovieNo){
                if($(".infotable[mv-uq='"+value.MovieNo+"']").length==0){
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Movie Name: </strong></br>"+value.MovieName+'</li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Director: </strong>"+value.Director+'</li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Casts: </strong></br>"+value.Casts+'</li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Rate: </strong><span class='badge head-text-badge'>"+value.Rate+'</span></li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Genre: </strong><span class='badge head-text-badge'>"+value.Genre+'</span></li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Studio: </strong>"+value.Studio+'&emsp;</li>');
                    $("#MovieInfo").append('<li class="infotable"mv-uq="'+value.MovieNo+'">'+"<strong>Duration: </strong>"+value.Duration+"min"+'&emsp;</li>');

                }
            }
    }); 
}
function frechBranch() {
    var payload = { table:"branch" };
    $.post('/fetchData',payload,(data)=>{
        data.forEach((value,key)=>{
                Branch.push ({
                    BranchNo:value.BranchNo,
                    BranchName:value.BranchName,
                    BranchAddress:value.BranchAddress,
                    PhoneNumber:value.PhoneNumber,
                    ManagerStaffNo:value.ManagerStaffNo,
                })
        });
        console.log(Branch)
        showbranch();
    });
}

function frechTheater(){
    var payload = { table:"theatre" };
    $.post('/fetchData',payload,(data)=>{
        data.forEach((value,key)=>{
            TheatreA.push ({
                TheatreCode:value.TheatreCode,
                BranchNo:value.BranchNo,
                PlanName:value.PlanName
            })
        });
    });
        console.log(TheatreA)
        

}

function showbranch() {
    $("#Branch").find('li').remove() 
    $("Branch_add").find('li').remove()
            Branch.forEach((value,key)=>{
            $("#Branch").append('<li class="clickTableBranch" value="'+value.BranchNo+'">'+value.BranchName+'</li>');
        });
        Branch.forEach((value,key)=>{
            $("#Branch_add").append('<li class="clickTableBranch" value="'+value.BranchNo+'">'+value.BranchName+'</li>');
        });

}
function showTheater(cl,data) {
    console.log(cl)
    $("#theater").find('li').remove()
    $("#theater_add").find('li').remove()
        TheatreA.forEach((value,key)=>{
            if(cl==value.BranchNo)
            $("#theater").append('<li class="clickTable">'+value.TheatreCode+'</li>');   
        });
        TheatreA.forEach((value,key)=>{
            if(cl==value.BranchNo)
            $("#theater_add").append('<li class="clickTable">'+value.TheatreCode+'</li>');   
        });
    
    
}

function showmovie(data) {
    $.get('/fetchDataMovie',(data)=>{
        data.forEach((value,key)=>{
            MovieSchedule.push( {
                MovieName: value.MovieName,
                MovieNo: value.MovieNo,
                Director: value.Director,
                Casts: value.Casts,
                Desc: value.Desc,
                Duration: value.Duration,
                Rate: value.Rate,
                Genre: value.Genre,
                Studio: value.Studio,
                PosterURL: value.PosterURL,
                TheatreCode: value.TheatreCode,
                ScheduleNo:value.ScheduleNo,
                Date: value.Date,
                Time: value.Time,
                Audio: value.Audio,
                Dimension: value.Dimension,
                Subtitle: value.Subtitle
            });
        });
        MovieSchedule.forEach((value,key)=>{
            if($(".MovieTable[mv-uq='"+value.MovieNo+"']").length==0){
                    // console.log('movie schedule==>',value);
                    let tempDate = new Date(value.Date)
                    let today = new Date()
                    let isHist = tempDate > today;
                    let histStatus = 'History';
                    if(isHist) histStatus = 'Now';
                    $("#Movie").append('<li data-st="'+histStatus+'" mv-uq="'+value.MovieNo+'" class="MovieTable" value="'+value.MovieNo+'" style="display: none;"  ><strong>Movie Name: </strong>'+value.MovieName+'<span class="badge head-text-badge">'+value.Rate+'</span></li>');
                    }
         });
         $("[data-st='Now']").show();
         $('body').on('change','#mode-select-sched',function(){  
            let str = this.value;
              console.log(str);
             $("[data-st="+str+"]").show();
             (str == 'History') ? $("[data-st='Now']").hide() : $("[data-st='History']").hide();
             $("#MovieInfo").find('li').remove();
             $("#Schedule").find('tr').remove();
             $('.changeMovie').hide()
             $('.AddSch').hide()
             $(".DeleteSch").hide()
             
            })  
        });
    }

function EditMovie (cl,data){
     if(MovieSchedule.MovieNo=cl){
        console.log(MovieSchedule)
    }
}

function compare(temp){
    var found = 0;
    schedule_list.forEach((value)=>{
        if( value.TheatreCode == temp.TheatreCode && value.Date == temp.Date && value.Time == temp.Time) found=1;
    })
    return found;
}

function addScheduleTable(){
    if($('#DateStart').val()!="" && theater != undefined ){
        var diff = ($('#DateEnd').val()=="") ? 0 : findDiffDate($('#DateStart').val(),$('#DateEnd').val());
        //console.log(diff);
        for(var i = 0; i <= diff ; i++){
            var day = new Date($('#DateStart').val());
            day.setDate(day.getDate()+i);
            var temp = {
                TheatreCode: theater,
                Date: day.toISOString().substring(0, 10),
                Time: $('#datetime24').val(),
                Audio: $('#Audio').val(),
                Dimension: $('#Dimension').val(),
                Subtitle: $('#SubTitle').val()
            }
            console.log(temp)
            if(!compare(temp)) schedule_list.push(temp);
            //console.log(temp);
        }      
    }
    updateSchedule_list(schedule_list);
    // schedule_list.push(temp);
    // updateSchedule_list(schedule_list);
}

function updateSchedule_list(data){
    $("#schedule-list").find("td").remove();
    data.forEach((value,key)=>{
        // $("#schedule-list").append('<li class="clickSchedule" value='+key+' >'+value.TheatreCode+'&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;'+value.Date+'&emsp;&emsp;'+value.Audio+'&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;'+value.Time+'&emsp;&emsp;&emsp;&emsp;&emsp;'+value.Subtitle+'&emsp;&emsp;&emsp;&emsp;'+value.Dimension+'&emsp;&emsp;&emsp;&emsp;<span class="deleteSchedule" value="'+key+'">X</span></li>');
        $("#schedule-list").append('<tr class="clickSchedule" data-st='+key+'><td class="table-center">'+value.TheatreCode+'</td><td>'+new Date(value.Date).getDate()+'-'+(new Date(value.Date).getMonth()+1)+'-'+new Date(value.Date).getFullYear()+'</td><td>'+value.Time+'</td><td class="table-center">'+value.Audio+'</td><td class="table-center"><span class="badge head-text-badge">'+value.Dimension+'</span></td><td class="table-center">'+value.Subtitle+'</td></tr>'); 
    })
}


function findDiffDate(Start,End){
    end = new Date(End)
    start = new Date(Start)
    diffTime = Math.abs(end.getTime() - start.getTime());
    return (start<end) ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : -1; 
}

function delete_schedule_list(){
        //$(this).addClass('selected').siblings().removeClass('selected')
        //console.log(this.innerHTML);
        //console.log($(this).attr('value'));
        console.log((this).getAttribute("data-st"))
        delete schedule_list[(this).getAttribute("data-st")];
        updateSchedule_list(schedule_list);
}

function delete_schedule_list_add(){
    //$(this).addClass('selected').siblings().removeClass('selected')
    //console.log(this.innerHTML);
    //console.log($(this).attr('value'));
    console.log((this).getAttribute("data-st"))
    delete schedule_list[(this).getAttribute("data-st")];
    updateSchedule_list_add(schedule_list);
}



function addScheduleTable_add(){

    if($('#DateStart_add').val()!="" && theater != undefined ){
        var diff = ($('#DateEnd_add').val()=="") ? 0 : findDiffDate($('#DateStart_add').val(),$('#DateEnd_add').val());
        //console.log(diff);
        for(var i = 0; i <= diff ; i++){
            var day = new Date($('#DateStart_add').val());
            day.setDate(day.getDate()+i);
            var temp = {
                TheatreCode: theater,
                Date: day.toISOString().substring(0, 10),
                Time: $('#datetime24_add').val(),
                Audio: $('#Audio_add').val(),
                Dimension: $('#Dimension_add').val(),
                Subtitle: $('#SubTitle_add').val()
            }
            console.log(temp)
            if(!compare(temp)) schedule_list.push(temp);
            //console.log(temp);
        }      
    }
    updateSchedule_list_add(schedule_list);
    // schedule_list.push(temp);
    // updateSchedule_list(schedule_list);
}

function updateSchedule_list_add(data){
    $("#schedule-list-add").find("td").remove();
    console.log('okkk')
    console.log(data)
    // $("#schedule-list-add").append('<li>theaterCode &emsp;&emsp;&emsp;&emsp; Date &emsp;&emsp;&emsp; Audio &emsp;&emsp;&emsp; StartTime &emsp;&emsp;&emsp;Subtitle &emsp;Dimension </li>');
    data.forEach((value,key)=>{
    $("#schedule-list-add").append('<tr class="clickSchedule" data-st='+key+'><td class="table-center">'+value.TheatreCode+'</td><td>'+new Date(value.Date).getDate()+'-'+(new Date(value.Date).getMonth()+1)+'-'+new Date(value.Date).getFullYear()+'</td><td>'+value.Time+'</td><td class="table-center">'+value.Audio+'</td><td class="table-center"><span class="badge head-text-badge">'+value.Dimension+'</span></td><td class="table-center">'+value.Subtitle+'</td></tr>'); 
    })
}


function DeleteMovie(data) {
    console.log(Movies)
    var payload = {MovieNo : Movies}
    console.log(payload)
    $.ajax({
        type:"DELETE",
        url: "/Deletemovies",
        data: payload,
        success: function(data) {
            window.location.replace("/admin");  
        }
    })
 }

 function DeleteSchedule(data) {
    console.log(Schedule_select)
    var payload = {ScheduleNo : Schedule_select,MovieNo : Movies}
    console.log(payload)
    $.ajax({
        type:"DELETE",
        url: "/DeleteSchedule",
        data: payload,
        success: function(data) {
            window.location.replace("/admin");  
        }
    })
 }
 


function createAllSchedules(){
    var payload = {
        Movie : {
        MovieName: $('#MovieName').val(),
        Director: $('#Director').val(),
        Casts: $('#Casts').val(),
        Desc: $('#Desc').val(),
        Duration: $('#Duration').val(),
        Rate: $('#Rate').val(),
        Genre: $('#Genre').val(),
        Studio: $('#Studio').val(),
        PosterURL: $('#PosterURL').val()
        },
        schedule : [...schedule_list]
    };
    console.log(payload)
     if(payload.Movie.MovieName!=''&&payload.Movie.Director!=''&&payload.Movie.Casts!=''&&payload.Movie.Desc&&payload.Movie.Duration!=''&&payload.Movie.Genre!=''&&payload.Movie.Rate!=''&&payload.Movie.Studio!=''&&payload.Movie.PosterURL!='') {
        $.ajax({
            type:"POST",
            url: "/movies",
            data: payload,
            success: function(data) {
                window.location.replace("/admin");  
            }
        })
     }
     else console.log("error")
}

function branch(){
    $(this).addClass('selected').siblings().removeClass('selected')
    console.log(this.value);
    branchName = this.value;
    console.log(branchName)
    showTheater(branchName,);

}
function select_theater(){
    $(this).addClass('selected').siblings().removeClass('selected')
    console.log(this.innerHTML)
    theater = this.innerHTML;
    console.log(theater)

}

function select_Movie(){
    $('.changeMovie').show()
    $('.AddSch').show()
    $(this).addClass('selected').siblings().removeClass('selected')
    console.log(this.value)
    Movies = this.value;
    $('#Schedule').show();
    ScheduleInfo(Movies,);
    MovieInfo(Movies,);
}

function select_Schedule(){
    $(".DeleteSch").show()
    $(this).addClass('selected').siblings().removeClass('selected')
    console.log(this.getAttribute("data-st"));
    Schedule_select =(this.getAttribute("data-st"));
    console.log(Schedule_select);

}

function callMovieForm(){
    $('#movieAndSchduleForm').show();
    $('.content-view').hide();
}

function callBackFromShow(){
    $('#ShowMovieAll').hide();
    $('.content-view').show();
}

function cancelAllSchedule(){
    $('#movieAndSchduleForm').hide();
    $('.content-view').show();
}

function UpdateDataMovie(){
    $('#EditMovieForm').show();
    $('.content-view').hide();
    var temp =[];
    console.log(Movies)
    MovieSchedule.forEach((value,key)=>{
        if(value.MovieNo==Movies){
         temp ={
            MovieName:value.MovieName,
            Director:value.Director,
            Casts:value.Casts,
            Desc:value.Desc,
            Duration:value.Duration,
            Rate:value.Rate,
            Genre:value.Genre,
            Studio:value.Studio,
            PosterURL:value.PosterURL,
            }
        }
        console.log(temp)
    })
    $('#MovieName_Add').val(temp.MovieName);
    $('#Director_Add').val(temp.Director);
    $('#Casts_Add').val(temp.Casts);
    $('#Desc_Add').val(temp.Desc);
    $('#Duration_Add').val(temp.Duration);
    $('#Rate_Add').val(temp.Rate);
    $('#Genre_Add').val(temp.Genre);
    $('#Studio_Add').val(temp.Studio);
    $('#PosterURL_Add').val(temp.PosterURL);
}

function AddDataSchedule(){
    $('#EditScheduleForm').show();
    $('.content-view').hide();
}

function EditMovieSucc(){
    var payload = {
        MovieNo:Movies,
        MovieName: $('#MovieName_Add').val(),
        Director: $('#Director_Add').val(),
        Casts: $('#Casts_Add').val(),
        Desc: $('#Desc_Add').val(),
        Duration: $('#Duration_Add').val(),
        Rate: $('#Rate_Add').val(),
        Genre: $('#Genre_Add').val(),
        Studio: $('#Studio_Add').val(),
        PosterURL: $('#PosterURL_Add').val()
    }
    console.log(payload)
    $.ajax({
        type:"post",
        url: "/moviesUpdate",
        data: payload,
        success: function(data) {
            window.location.replace("/admin");  
        }
    });
}

function addAllSchedule(){
    var payload = {
        Movie : {
        MoveNo :Movies,
        TheatreCode :theater},
        schedule : [...schedule_list]
    };
    console.log(payload)
    $.ajax({
        type:"POST",
        url: "/AddNewSchedule",
        data: payload,
        success: function(data) {
            window.location.replace("/admin");  
        }
    })

}



function CancelNewSchedule(){
    $('#EditScheduleForm').hide();
    $('.content-view').show();
    $("#schedule-list-add").find("td").remove();
    $("#theater_add").find("li").remove();
    $("#Branch_add").find("li").remove();
    showbranch();

}

$(document).on('click',".clickTable", select_theater);
$(document).on('click',".clickTableBranch", branch);
$(document).on('click',"#addSchedule",addScheduleTable);
$(document).on('click',"#addSchedule1",addScheduleTable_add);
$(document).on("click","#backToAdmin", callBackFromShow);
// $(document).on("click",".deleteSchedule",delete_schedule_list);
$(document).on("click","#createAllSchedule", createAllSchedules);   
$(document).on("click","#cancelAllSchedule", cancelAllSchedule);  
$(document).on("click",".clickSchedule",delete_schedule_list); //delete onclick at create 
$(document).on("click","#schedule-list-add",delete_schedule_list_add);//delete onclick at add
// -------admin page-----------
$(document).on("click","#createMovie", callMovieForm);
$(document).on("click","#EditMovie", UpdateDataMovie);
$(document).on("click","#DeleteMovie", DeleteMovie);
$(document).on("click","#DeleteSchedule", DeleteSchedule);
$(document).on('click',".MovieTable",select_Movie);
$(document).on('click',".scheduleTable",select_Schedule);
$(document).on("click","#AddSchedule", AddDataSchedule);
$(document).on("click","#EditMovieSucc", EditMovieSucc);
$(document).on("click","#AddSchedule1", addScheduleTable);
$(document).on("click","#addAllSchedule",addAllSchedule);
$(document).on("click","#CancelNewSchedule",CancelNewSchedule);

// ----------------------------
frechBranch();
frechTheater();
showmovie();