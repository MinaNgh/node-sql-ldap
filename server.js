var express = require('express');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const dotenv = require( "dotenv" );
const router = express.Router();
var passport     = require('passport');
var LdapStrategy = require('passport-ldapauth');
var LdapAuth = require('ldapauth-fork');
const tempfile = require('tempfile');
//flash

const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
//start app
var app = express();
app.set('view engine', 'ejs');
//POST request
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//flash
app.use(cookieParser('secret'));
app.use(session({
  cookie:{maxAge:60000},
  secret:'tetsgbjlsdfds',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(function(req, res, next){
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    next();
});
// app.all('/', function(req, res){
//   req.flash('test', 'it worked');
//   res.redirect('/test')
// });
// app.all('/test', function(req, res){
//   res.send(JSON.stringify(req.flash('test')));
// });

// req.flash({
//   type: 'info',
//   message: 'if cats rules the world',
//   redirect: false
// })
// app.use(express.static(__dirname + '/views'));
app.use(express.static(path.join(__dirname, 'public')));

var ActiveDirectory = require('activedirectory');

dotenv.config();
const { PORT,
  HOST,
  HOST_URL,
  COOKIE_ENCRYPT_PWD,
  SQL_SERVER,
  SQL_PORT,
  SQL_DATABASE,
  SQL_USER,
  SQL_PASSWORD,
  LDAP_URL,
  LDAP_BIND_DN,
  LDAP_SEARCH_FILTER,
  LDAP_SEARCH_BASE,
  LDAP_USERNAME,
  LDAP_BIND_CREDENTIALS,
  LDAP_GROUP_SEARCH_BASE,
  LDAP_GROUP_SEARCH_FILTER 
} = process.env;

var config = { url: LDAP_URL,
               baseDN: LDAP_SEARCH_BASE,
               username: LDAP_USERNAME,
               password: LDAP_BIND_CREDENTIALS }
var ad = new ActiveDirectory(config);
// read in the .env file

 // passport.use(new ActiveDirectory(config));
// app.post('/login', function (req, res, next) {
//   var username = req.body.username;
//   var groupName = 'App Access - FinanceBizzApps';
//   var password = req.body.password;
//   ad.isUserMemberOf(username, groupName, function(err, isMember) {

//     if (err) {
//       console.log('ERROR: ' +JSON.stringify(err));
//       return;
//     }
   
//     console.log(username + ' isMemberOf ' + groupName + ': ' + isMember);
//   });


// });

var OPTS = {
  server: {

    url: LDAP_URL,
    bindDN: LDAP_BIND_DN, 
    searchFilter: LDAP_SEARCH_FILTER,

    searchBase: LDAP_SEARCH_BASE,
    username: LDAP_USERNAME,
    bindCredentials: LDAP_BIND_CREDENTIALS,
    groupSearchBase: LDAP_GROUP_SEARCH_BASE,
    groupSearchFilter: LDAP_GROUP_SEARCH_FILTER 

  
  }
};

passport.use(new LdapStrategy(OPTS));
//landing page
app.get('/',function(req,res) {
  // console.log(JSON.stringify(req.flash('message')));
  // res.sendFile(path.join(__dirname+'/views/index.html'),JSON.stringify(req.flash('message')));
  // res.send(JSON.stringify(req.flash('message')));
  res.render('index', { message: req.flash('info'), type: req.flash('type') });
});
//authentication
// app.post('/login',function(req,res) {

//   var username = req.body.username;
//   var password = req.body.password;
//   console.log(username);
 
  
// });
// app.post('/login', passport.authenticate('ldapauth', {session: false}), function(req, res) {
//   res.send({status: 'ok'});
// });



app.post('/login', function (req, res, next) {
  passport.authenticate('ldapauth', {session: false}, function (err, user, info) {
      console.log(info);
      if (err) {
          return next(err); // will generate a 500 error
          // es.redirect('/');
      }
      // Generate a JSON response reflecting authentication status
      if (!user) {
          // return res.send({success: false, message: 'authentication failed'});
          // return res.send({success: false, message: 'authentication failed'});

           // req.flash('info', 'invalid username or password');
          req.flash('info', 'invalid username or password');
          req.flash('type', 'danger');
          res.redirect('/')
          // res.redirect('/');

      }else{
      // return res.send({success: true, message: 'authentication succeeded'});
      var username = req.body.username;
      var groupName = 'App Access - FinanceBizzApps';
          // var password = req.body.password;
          ad.isUserMemberOf(username, groupName, function(err, isMember) {

            if (err) {
              // return res.send('ERROR: ' +JSON.stringify(err));
              console.log('ERROR: ' +JSON.stringify(err));
              req.flash('info', 'Oops...something went wrong, please contact a system administrator');
              req.flash('type', 'danger');
              res.redirect('/');
              // req.flash('info', 'Oops...something went wrong, please contact a system administrator');
            
            }
            if(!isMember){
             // return res.send('Oops...'+ username + ' is not the member of' + groupName );
             req.flash('info', 'Oops...'+ username + ' is not the member of ' + groupName);
             req.flash('type', 'danger');

             res.redirect('/');
             // req.flash('info', 'Oops...'+ username + ' is not the member of ' + groupName );
            }else{
             // res.sendFile(path.join(__dirname+'/views/get-report.html'),{message:req.flash('Success!')});
             
             

             // req.flash('info', 'Success' );
             // res.render('get-report',{message:req.flash('Success!')});
             req.flash('info', 'Signed in successfully!');
             req.flash('type', 'info');
             res.redirect('/report');
            }
            // return res.send(username + ' isMemberOf ' + groupName + ': ' + isMember);
            // return res.send('success');

            
          });
        }

  })(req, res, next);
});
app.get('/report',function(req,res){
  
  res.render('get-report', { message: req.flash('info'), type: req.flash('type') });
})

app.get('/download-report', function (req, res) {

    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    var type = req.query.type;
    console.log(startDate);
    // config for your database
   
    var config = {
        user: SQL_USER,
        password: SQL_PASSWORD,
        port: parseInt(SQL_PORT),
        server : SQL_SERVER,
        database: SQL_DATABASE 
    
    };
    //csv file fields
    const fields = [
    'LINE_TYPE', 
    'CUSTOMER_NAME', 
    'PO_NUMBER',
    'QUOTE_NUMBER',
    'SALES_ORDER_DATE',
    'SALES_ORDER_NUMBER',
    'SALESORDER_LINE_NUMBER',
    'SALESORDER_LINE_ID',
    'REVENUE_START_DATE',
    'REVENUE_END_DATE',
    'LINE_ITEM_NUMBER',
    'ORDERED_QTY',
    'EXT_SELL_PRICE',
    'EXT_LIST_PRICE',
    'TRANSACTION_CURRENCY',
    'FUNCTIONAL_EX_RATE',
    'FUNCUTIONAL_CURRENCY',
    'GLOBAL_EX_RATE',
    'DEFFERED_SEGMENTS_NO',
    'DEFFERED_SEGMENTS_NAME',
    'INCOME_ACCOUNT_NO',
    'INCOME_ACCOUNT_NAME',
    'INVOICE_QTY',
    'INVOICE_LINE_ID',
    'INV_DATE',
    'INV_LINE_NUM',
    'INV_NUM',
    'RET_QTY',
    'ORIG_INV_LINE_ID',
    'SSP_ELIGIBLE_FLAG',
    'ALLOCATION_ELIGIBLE_FLAG',
    'RIGHT_TO_BILLING_FLAG',
    'ATR1_END_USER',
    'ATR2_RESELLER',
    'ATR3_CHANNEL',
    'ATR5_CONVERSION_ORDERS_GROUPING',
    'ATR6_ITEM_TYPE',
    'ATR8_OPPORTUNITY_ID',
    'ATR8_QTY_BAND',
    'ATR10_REGION',
    'ATR12_VSOE_BUCKET',
    'NUM1_NET_LICENSE_PRICE',
    'ATR7_FIELD_X',
    'ATR15_ITEM_DESCRIPTION',
    'DISCOUNT_PERCENT',
    'ATR16_CM_REASON_CODE',
    'ATR17_ACCEPTANCE_CLAUSE',
    'ATR18_PAYMENT_TERM',
    'ATR19_TERMINATION_FOR_CONVENIENCE_WITH_REFUND',
    'ATR20_ORDER_CLOSE_DATE',
    'ATR21_ORDER_FULFILLED_DATE',
    'ATR22_PROJECT_NUMBER',
    'ATR23_RENEWAL_FLAG',
    'ATR24_RENEWAL_TRAIL',
    'ATR26_BILL_TO',
    'ATR27_DISTRIBUTOR',
    'ATR28_REVENUE_ITEM_CATEGORY',
    'REVPRO_ADD_LAST_MODIFIED_DATE',
    'NUM',
    'OPPORTUNITY_NAME',
    'SW_UNIT_PRICE',
    'CENTRIFY_PRORATED_LIST_PRICE',
    'SERVICE_LEVEL',
    'SF_PRORATED_MULTIPLIER',
    'PARTNER_DISCOUNT_REFERRAL',
    'CUSTOMER_ID',
    'NETSUITE_CUSTOMER_ID',
    'BUSINESS_UNIT',
    'STATUS'];
    
    // connect to your database
    sql.connect(config, function (err) {
    
        if (err) console.log('FirstError:'+err);

        // create Request object
        var request = new sql.Request();
           
        // query to the database and get the records
      
        var query = `select '${type}' AS 'LINE_TYPE',
        tg.END_USER_ID as 'CUSTOMER_NAME',
        tg.PO as 'PO_NUMBER',
        tg.QuoteNO as 'QUOTE_NUMBER',
        CONVERT(varchar(10), tg.Sales_Order_Date, 101)  as 'SALES_ORDER_DATE',
        tg.TRANID AS 'SALES_ORDER_NUMBER',
        tg.TRANSACTION_LINE_ID as 'SALESORDER_LINE_NUMBER',
        (tg.TRANID+'_'+tg.SALESFORCELINEID) as 'SALESORDER_LINE_ID',
        CONVERT(varchar(10), tg.REVENUE_START_DATE_SO, 101)  as 'REVENUE_START_DATE',
        CONVERT(varchar(10), tg.REVENUE_END_DATE_SO, 101)  as 'REVENUE_END_DATE',
        tg.ITEM  AS 'LINE_ITEM_NUMBER',
        IIF (tg.ITEM_TYPE like '%Maintenance%','1',tg.QTY ) as 'ORDERED_QTY',
        tg.AMOUNT as 'EXT_SELL_PRICE',
        ql.[Centrify_ProratedListPrice__c] * tg.QTY as 'EXT_LIST_PRICE',
        'USD' AS 'TRANSACTION_CURRENCY',
        '1' AS 'FUNCTIONAL_EX_RATE',
        'USD' AS 'FUNCUTIONAL_CURRENCY',
        '1' AS 'GLOBAL_EX_RATE',
        tg.DEFERRED_REVENUE_ACCOUNT_NO as 'DEFFERED_SEGMENTS_NO',
        tg.DEFERRED_REVENUE_ACCOUNT_NAME as 'DEFFERED_SEGMENTS_NAME',
        tg.INCOME_ACCOUNT_NO as 'INCOME_ACCOUNT_NO',
        tg.INCOME_ACCOUNT_NAME as 'INCOME_ACCOUNT_NAME',
        '' AS 'INVOICE_QTY',
        '' AS 'INVOICE_LINE_ID',
        '' AS 'INV_DATE',
        '' AS 'INV_LINE_NUM',
        '' AS 'INV_NUM',
        '' AS 'RET_QTY',
        '' AS 'ORIG_INV_LINE_ID',
        '' AS 'SSP_ELIGIBLE_FLAG',
        --'Y' as 'ALLOCATION_ELIGIBLE_FLAG',
        IIF ((tg.ITEM_REVENUE_CATEGORY  like '%Misc%' OR tg.ITEM_REVENUE_CATEGORY  like '%Subscription-CRH%'OR tg.ITEM_REVENUE_CATEGORY  like '%OEM Royalty-Usage%' ),'N','Y') as 'ALLOCATION_ELIGIBLE_FLAG',
        'Y' as 'RIGHT_TO_BILLING_FLAG',
        tg.END_USER_ID as 'ATR1_END_USER',
        tg.RESELL as 'ATR2_RESELLER',
        op.Classification__c as 'ATR3_CHANNEL',
        'N' as'ATR5_CONVERSION_ORDERS_GROUPING',--Need to Add Logic
        tg.ITEM_TYPE as  'ATR6_ITEM_TYPE',
        o.[SBQQ__Opportunity2__c] as 'ATR8_OPPORTUNITY_ID',
        '' AS 'ATR8_QTY_BAND',
        Case
        WHEN op.Classification__c = 'Federal' THEN 'Federal'
        ELSE tg.REGION
        END as 'ATR10_REGION',
        Case
        WHEN tg.VSOE ='Premium &lt;250k' THEN 'Premium<250'
        WHEN tg.VSOE ='Premium &gt;250k' THEN 'Premium>250'
        ELSE tg.VSOE
        END as 'ATR12_VSOE_BUCKET',
        IIF (tg.VSOE ='Premium &gt;250k', CONVERT(Int, o.SLET__c, 2),'') as 'NUM1_NET_LICENSE_PRICE',
        '' AS 'ATR7_FIELD_X',
        tg.SALESDESCRIPTION AS 'ATR15_ITEM_DESCRIPTION',
        '' AS 'DISCOUNT_PERCENT',
        '' AS'ATR16_CM_REASON_CODE',
        'N' AS'ATR17_ACCEPTANCE_CLAUSE',
        tg.TERMS as 'ATR18_PAYMENT_TERM',
        'N' AS'ATR19_TERMINATION_FOR_CONVENIENCE_WITH_REFUND',
        CONVERT(varchar(10), op.CloseDate , 101)  as'ATR20_ORDER_CLOSE_DATE',
        CONVERT(varchar(10), tg.FULFILLED_DATE, 101)'ATR21_ORDER_FULFILLED_DATE',
        IIF (tg.ITEM_TYPE='PS', tg.END_USER_ID+'_'+tg.QuoteNO+'_'+tg.ITEM_REVENUE_CATEGORY,'') as 'ATR22_PROJECT_NUMBER',
        CASE tg.SKU
        WHEN'R' THEN 'Y'
        ELSE'N'
        END as 'ATR23_RENEWAL_FLAG',
        op.[Name] as 'ATR24_RENEWAL_TRAIL',
        --'' AS 'ATR25_SHIP TO',--Need to check
        tg.ENTITY as 'ATR26_BILL_TO',
        tg.DISTRIBUTOR_ID as 'ATR27_DISTRIBUTOR',
        --tg.ITEM_REVENUE_CATEGORY as'ATR28_REVENUE_ITEM_CATEGORY',
        tg.BUSINESS_CATEGORY as'ATR28_REVENUE_ITEM_CATEGORY',
        CONVERT(varchar(10), tg.LAST_MODIFIED_DATE, 101)  as'REVPRO_ADD_LAST_MODIFIED_DATE',
        '' AS'NUM',
        Case
        WHEN op.[Name] like '%MTC:%' THEN op.[Name] + ' ' + + SUBSTRING (CONVERT(varchar(10), op.CloseDate , 101),7, 9)
        WHEN op.[Name] like '%SUBREN:%'THEN op.[Name] + ' ' + SUBSTRING (CONVERT(varchar(10), op.CloseDate , 101),7, 9)
        ELSE op.[Name]
        END as 'OPPORTUNITY_NAME',
        Case
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Premium' and tg.REGION ='North America' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1.1/1/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Standard' and tg.REGION ='North America' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1/1/1.6*2.5 /ql.SBQQ__ProrateMultiplier__c, 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Premium' and tg.REGION ='EMEA' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1.1/1.05/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Standard' and tg.REGION ='EMEA' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1/1.05/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Premium' and tg.REGION ='APAC' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1.1/1.05/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Standard' and tg.REGION ='APAC' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1/1.05/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Premium' and tg.REGION ='Latin America' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1.1/1.15/1.6*2.5/ql.SBQQ__ProrateMultiplier__c , 0) AS int)
        WHEN tg.ITEM_TYPE='Term License' AND ql.Service_Level__c ='Standard' and tg.REGION ='Latin America' THEN  CAST(ROUND(CONVERT(Int, ql.Centrify_ProratedListPrice__c, 2)/1/1.15/1.6*2.5 /ql.SBQQ__ProrateMultiplier__c, 0) AS int)
        ELSE
        CAST(ROUND(0, 0) AS decimal)
        END as 'SW_UNIT_PRICE',
        ql.[Centrify_ProratedListPrice__c] * tg.QTY as 'CENTRIFY_PRORATED_LIST_PRICE',
         
         
        ql.Service_Level__c as 'SERVICE_LEVEL',
        ql.SBQQ__ProrateMultiplier__c as 'SF_PRORATED_MULTIPLIER',
        Case
        WHEN SUBSTRING (tg.ENTITY,1,3) like '%CDW%' THEN 'CDW'
        WHEN SUBSTRING (tg.ENTITY,1,5)  like '%Optiv'THEN 'Optiv'
        ELSE ''
        END as 'PARTNER_DISCOUNT_REFERRAL',
        op.[AccountId] as 'CUSTOMER_ID',
        tg.NS_CUSTOMERID as'NETSUITE_CUSTOMER_ID',
        Case
        WHEN tg.BUSINESS_UNIT= '1' THEN 'INFRA'
        WHEN tg.BUSINESS_UNIT= '2' THEN 'A/E'
        ELSE 'Not Applicable'
        END as 'BUSINESS_UNIT',
        tg.STATUS as 'STATUS'
        from openquery(NSIDAP, '
        select t.TRANID, tl.TRANSACTION_LINE_ID, (tl.AMOUNT*-1) ''AMOUNT'' , tl.SFDC_LINE_ID as  ''SALESFORCELINEID'', r.FULL_NAME ''ITEM'', LTRIM(RTRIM(r.SALESDESCRIPTION)) ''SALESDESCRIPTION'', tl.CENTRIFY_LIST_TOTAL,(tl.ITEM_COUNT*-1) "QTY",
        d.COMPANY_ID ''NS_CUSTOMERID'',
        bc.LIST_ITEM_NAME as "BUSINESS_CATEGORY",
        a.FULL_Name  ''DEFERRED_REVENUE_ACCOUNT_NAME'',
        a.ACCOUNTNUMBER   ''DEFERRED_REVENUE_ACCOUNT_NO'',
        b.ACCOUNTNUMBER as ''INCOME_ACCOUNT_NO'',
        b.FULL_Name as ''INCOME_ACCOUNT_NAME'',
        SUBSTR(r.FULL_NAME,1,1) ''SKU'',t.TRANDATE ''FULFILLED_DATE'', t.SALES_EFFECTIVE_DATE ''CLOSED_WON_DATE'',
        c.FULL_NAME ''ENTITY'', re.FULL_NAME ''RESELL'', dis.FULL_NAME ''DISTRIBUTOR_ID'', c.COMPANY_ID ,pt.Name ''TERMS'',t.RELATED_TRANID ''PO'',t.VSOE_BUCKET ''VSOE'',r.ITEM_REVENUE_CATEGORY ''ITEM_REVENUE_CATEGORY'',
        d.FULL_NAME ''END_USER_ID'',rg.LIST_ITEM_NAME ''REGION'',t.date_last_modified ''LAST_MODIFIED_DATE'',rX.TRANID ''REVID'',r.BUSINESS_UNIT_ID as "BUSINESS_UNIT",
        tl.REVENUE_END_DATE_SO ''REVENUE_END_DATE_SO'' , CAST(tl.REV_REC_END_DATE  AS DATE)''REV_REC_END_DATE'', CAST(tl.REV_REC_START_DATE  AS DATE)  ''REV_REC_START_DATE''
        ,CAST(tl.REVENUE_START_DATE_SO AS DATE)''REVENUE_START_DATE_SO'', t.quote_number ''QuoteNO'',itl.LIST_ITEM_NAME ''ITEM_TYPE'',r.ITEM_ID ''ITM_ID'',t.CREATE_DATE ''Sales_Order_Date'', t.STATUS ''STATUS''
        from  TRANSACTIONS t
        INNER JOIN TRANSACTION_LINES tl ON t.TRANSACTION_ID = tl.TRANSACTION_ID
        INNER JOIN ITEMS r ON r.ITEM_ID = tl.ITEM_ID
        LEFT JOIN ITEM_TYPE_LIST itl ON r.ITEM_TYPE_ID = itl.LIST_ID
        LEFT JOIN BUSINESS_CATEGORY bc ON r.BUSINESS_CATEGORY_ID = bc.LIST_ID
        INNER JOIN  COMPANIES d ON d.COMPANY_ID = t.END_USER_ID
        INNER JOIN ACCOUNTS a ON a.ACCOUNT_ID = r.INCOME_ACCOUNT_ID
        INNER JOIN ACCOUNTS b ON b.ACCOUNT_ID = r.INCOME_ACCOUNT_ID_0
        LEFT JOIN (SELECT DISTINCT QUOTE_NUMBER,TRANID  from  TRANSACTIONS WHERE TRANID Like''%RC-%'')rX ON  t.QUOTE_NUMBER = rX.QUOTE_NUMBER
        INNER JOIN (SELECT DISTINCT COMPANY_ID , FULL_NAME from  COMPANIES)c ON  t.ENTITY_ID = c.COMPANY_ID
        LEFT JOIN (SELECT DISTINCT COMPANY_ID , FULL_NAME from  COMPANIES)re ON  t.RESELLER_ID = re.COMPANY_ID
        LEFT JOIN (SELECT DISTINCT COMPANY_ID , FULL_NAME from  COMPANIES)dis ON  t.DISTRIBUTOR_ID = dis.COMPANY_ID
        LEFT JOIN PAYMENT_TERMS pt ON pt.PAYMENT_TERMS_ID = t.PAYMENT_TERMS_ID--3
        LEFT JOIN REGION_LIST rg ON  t.REGION_SO_ID = rg.LIST_ID
        where  t.TRANID like ''%SO%''
        and t.TRANDATE >= ''${startDate}'' and t.TRANDATE <=''${endDate}''
        and r.FULL_NAME <>''AVATAX''
        and t.STATUS <> ''Cancelled''
        order by t.TRANID
        ')tg
        left outer join  [nssfdcprod].dbo.[SBQQ__Quote__c] o  on o.[Name] = tg.QuoteNO
        left outer join [nssfdcprod].dbo.[Opportunity] op on o.[SBQQ__Opportunity2__c] =  op.id
        left outer join [nssfdcprod].dbo.[SBQQ__QuoteLine__c] ql on ql.[id] =  tg.SALESFORCELINEID
        `;
        request.query(query, function (err, recordset) {
            
            if (err){
              console.log('SecondError:'+err);
              req.flash('info', 'Oops...something went wrong, please contact a system administrator');
              req.flash('type', 'danger');
              res.redirect('/report');
            } else{

            // send records as a response
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(recordset.recordsets[0]);
            // console.log(recordset.recordsets[0]);    
            // res.download(csv); 
            // res.send(csv);
            
            

            // write some data with a base64 encoding
            // let writeStream = fs.createWriteStream('data.csv');
            // writeStream.write(csv);
   
            // res.download(path.join(__dirname, '/data.csv'));
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            today = mm + '-' + dd + '-' + yyyy;

            var path=`./public/file/${today}-${type}.csv`; 
            fs.writeFile(path, csv, function(err,data) {
                if (err) {
                  // throw err;
                  console.log('ThirdError:'+err);
                  req.flash('info', 'Oops...something went wrong, please contact a system administrator');
                  req.flash('type', 'danger');
                  res.redirect('/report');
                }
                else{ 
                  // res.download(path); 
                  // res.jsonp({success : true})
                  req.flash('info', 'Download has been successfully completed!');
                  req.flash('type', 'info');
                  res.redirect('/report');
                  // res.redirect('/');
                }
            });
            var tmp = tempfile('.csv');
            // fs.csv.writeFile(tmp).then(function() {
            //   console.log('file is written');
            //   res.download(tmp, function(err){
            //       console.log('---------- error downloading file: ' + err);
            //   });
            // });
            // fs.writeFile(tmp, csv, function(err,data) {
            //     if (err) {
            //       // throw err;
            //       console.log('ThirdError:'+err);
            //       req.flash('info', 'Oops...something went wrong, please contact a system administrator');
            //       req.flash('type', 'danger');
            //       res.redirect('/report');
            //     }
            //     else{ 
            //       // res.download(path); 
            //       // res.jsonp({success : true})
            //       req.flash('info', 'Download has been successfully completed!');
            //       req.flash('type', 'info');
            //       console.log('file is written');
            //   res.download(tmp, function(err){
            //       console.log('---------- error downloading file: ' + err);
            //   });
            //       // res.redirect('/');
            //     }
            // });

          }
            // bar.animate(1);
            
            sql.close();
            
           
            
        });
        
    });
    
});
// app.post('/login', 
//     passport.authenticate('ldapauth', {
//             failWithError: true,
//             successRedirect: "/",
//             failureRedirect: "/login"
//         }
//     ), function(req, res) {
//         res.json(req.user)
//     }, function (err) {
//         res.status(401).send('Not Authenticated')
//     }
// )


// run the server
var server = app.listen(5005, function () {
    console.log('Server is running...');
});
module.exports = app;


 
