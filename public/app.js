// $('#report-form').submit(function(){
//    alert('hi');
//     $.ajax({
//             type: 'post',
//             url: '/download-report',
//             success: function(data) {
//                 console.log('------- data: ' + data);
//                 window.open(data, '_blank');
//             },
//             error: function(err) {
//                 console.log('------------ Error: ' + err);
//             }
//         });
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

