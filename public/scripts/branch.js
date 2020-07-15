function ManagerOption(){
    var payload = { table:"staff" };
    $.post('/fetchData',payload,(data)=>{
        data.forEach((value,key)=>{
            if(value.Position=="manager")
            $("#Manager").append('<option class="form-control-plaintext" value="'+value.StaffNo+'">'+value.FirstName+'</option>');
        });
        console.log(data)
    });
}

ManagerOption();