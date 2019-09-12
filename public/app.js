// $('#report-form').submit(function(){

//     var data = {};
//    data.startDate = $('#startDate').val();
//    data.endDate = $('#endDate').val();
//    data.type = $('#type').val();
   
//     console.log('hi');
//     $.ajax({
//             method: 'POST',
//             url: '/report',
//             data: JSON.stringify(data),
            
//              success: function (data) {
//             // var ret = jQuery.parseJSON(data);
//             // $('#lblResponse').html(ret.msg);
//             console.log('Success: ')
//         },
//         error: function (xhr, status, error) {
//             console.log('Error: ' + error.message);
//             // $('#lblResponse').html('Error connecting to the server.');
//         },
            
//         })
//             // error: function(err) {
//             //     console.log('------------ Error: ' + err);
//             // }
// });

// $('#signin-btn').click(function(){
//     const loginForm = $('#login-form')
//     $.ajax({
//     url:"/login",
//     method: "POST",
//     data: loginForm.serialize(),
//     cache : false,
//     success : function (data) {
//         // data is the object that you send form the server by 
//         // res.jsonp();
//         // here data = {success : true}
//         // validate it
//         if(data['success']){
//             alert("message you want to show");
//         }
//     },
//     error : function () {
//         // some error handling part
//         alert("Oops! Something went wrong.");
//     }
//     });
// });
// var alertBox = $( '.flash' );

// setTimeout( function() {
//         alertBox.fadeOut( 'slow' );
//     }, 5000 );
// $('.flash').delay(2000).fadeOut();
// 

 $(document).ready( function(){
        var reportForm = $('#reportForm')

        reportForm.on('submit', submitHandler)
       
        function submitHandler (e) {
         
          e.preventDefault()
          $("#processing").css("display", "block");
          $.ajax({
            url: '/reportDownload',
            type:'POST',
            data: reportForm.serialize(),
       
          }).done(data => {
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            today = mm + '-' + dd + '-' + yyyy;

            const a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
           
            const blob = new Blob([data.data], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = `${today}-${data.type}.csv`;
            a.click();
            window.URL.revokeObjectURL(url); 

            $("#processing").css("display", "none");
            $('#reportForm')[0].reset();

            window.location.href ='/report';
            console.log(data.data)
             

        });
}

  setTimeout(function() {
    $('.successMessage').fadeOut('slow');
    }, 3000); // <-- time in milliseconds

});

