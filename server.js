//Initialisierung Server
const express = require('express');
const app = express();

//Initialisierung bodyparser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//Initialisierung ejs
app.set('view engine', 'ejs');

//tingodb setup
const DB_COLLECTION = 'wg';                         //Name von der Datenbank
const Db = require('tingodb')().Db;      
const db = new Db(__dirname + '/tingodb', {});      //Name vom (leerem) Ordner im Projektordner 
const ObjectId = require('tingodb')().ObjectID;

//session setup
const session = require('express-session');
app.use(session({
    secret: 'this-is-a-secret',     //necessary for encoding
    resave: false,                  //should be set to false, except store needs it
    saveUninitialized: false        //same reason as above.
}));

//password hash, um das Passwort zu entschlüsseln
const passwordHash = require('password-hash');

//port
app.listen(3000, () => {
    console.log('Listening to Port 3000');
});

//Einloggen (html)
app.get('/', (request, response) => {                //wir wollen die Seite aufrufen
    response.sendFile(__dirname + '/index.html');    //die Index Html Seite wird als Antwort geschickt
});

//Registrieren (html)
app.get('/register', (request, response) => {        //wir wollen die Seite register aufrufen 
    response.sendFile(__dirname + '/register.html'); //register.html wird an den Verzeichnisnamen dran gehängt  
});

//Regristieren nach Ausfüllen und Buttonklick in der Html Seite
app.post('/wg/register', (request, response) => {

    const wgname = request.body.wgname;       //die eingegebenen Werte von der register.html Seite werden hier in Konstanten gespeichert  
    const password = request.body.password;
    const repPassword = request.body.repPassword;
    const user1 = request.body.user1; 
    const user2 = request.body.user2;  
    const user3 = request.body.user3; 
    const user4 = request.body.user4; 


    let errors = [];                                       //Array namens errors deklariert, um Fehlermeldungen zu sammeln 
    if (wgname == "" || wgname == undefined) {              
        errors.push('Bitte einen WgNamen eingeben.');      
    } 
    if (password == "" || password == undefined) {         //Bedingung: es wurde kein Passwort eingetragen
        errors.push('Bitte ein Passwort eingeben.');       //mit dem push Befehl wird dem obrigen Array der String (in grün) hinzugefügt 
    } 
    if (repPassword == "" || repPassword == undefined) {
        errors.push('Bitte ein Passwort zur Bestätigung eingeben.');
    } 
    if (password != repPassword) {
        errors.push('Die Passwörter stimmen nicht überein.');
    }
    if (user1 == "" || user1 == undefined){
        errors.push('Bitte einen User Namen eingeben') 
    } 
    if (user2 == "" || user2 == undefined){
        errors.push('Bitte einen User Namen eingeben')
    } else o
    if (user3 == "" || user3 == undefined){
        errors.push('Bitte einen User Namen eingeben')
    }
    if (user4 == "" || user4 == undefined){
        errors.push('Bitte einen User Namen eingeben')
    }

    db.collection(DB_COLLECTION).findOne({'wgname': wgname}, (error, result) => {     //die komplette Datenbank wird nach einzelnen Daten durchsucht, hier: wgname 
        if (result != null) {                                                         //Bedingung: in der Datenbank wird der wgname gefunden, wenn nicht wäre das Ergebniss null, weil das Array keine Elemente hat 
            errors.push('Die Wg gibt es leider schon!');                              //Anweisung: dem Array wird eine Fehlermeldung hinzugefügt
            response.render('errors', {'error': errors});                             //error.ejs wird ausgeführt und dort die gesammelten Fehlermeldungen angezeigt
        } else {                                                                      //sonst: 
            if (errors.length == 0) {                                                 //Bedingung: im Array befindet sich keine Fehlermeldung, also kein Element  
                const encryptedPassword = passwordHash.generate(password);            //entschlüsseltes Passwort wird in einer Konstanten gespeichert 

                const newWG = {                                                       //alle Werte von der Registrierung werden mit entsprechender Bezeichnung in einer Konstanten gespeichert 
                    'wgname': wgname,
                    'password': encryptedPassword,
                    'user1': user1,
                    'user2': user2,
                    'user3': user3,
                    'user4': user4
                }
    
                db.collection(DB_COLLECTION).save(newWG, (error, result) => {         //wir speichern die oben initialisierte Konstante in der Datenbank 
                    if (error) return console.log(error);                             //bei einem Fehler wird dieser in der Konsole angezeigt 
                    console.log('Wg zur Datenbank hinzugefügt');                      //Sonst wird in der Konsole der Text in grün ausgegeben 
                    response.redirect('/');                                           //und die Startseite (Login) wird wieder aufgerufen 
                });
            } else {
                response.render('errors', {'error': errors});                         //falls Elemente im Array waren, dann wird die errors.ejs Seite wieder ausgeführt 
            }
        } 
    });
});

//Login überprüfen nachdem im index.html Login angeklickt worden ist 
app.post('/wg/login', (request, response) => {

    const wgname = request.body.wgname;
    const password = request.body.password;
    
    let errors = [];
    
    db.collection(DB_COLLECTION).findOne({'wgname': wgname}, (error, result) => {     //die komplette Datenbank wird nach einzelnen Daten durchsucht, hier: wgname 
        if (error) return console.log(error);
    
        if (result == null) {                                                         //Bedingung: in der Datenbank wird der wgname nicht gefunden (es gibt "keine" Ergebnisse)
            errors.push('Die WG ' + wgname + ' gibt es nicht.');                      //dem Array errors wird eine entsprechende Fehlermeldung hinzugefügt 
            response.render('errors', {'error': errors});
            return;
        } else {
            if (passwordHash.verify(password, result.password)) {                     //Bedingung: das angegebene Passwort und das Passwort, dass in dem Datensatz von dem wgnamen gefunden wurde, stimmt überein 
                request.session.authenticated = true;                                 //Session Variable bekommt den Wert true zugewiesen 
                request.session.wgname = wgname;

                let wgbewohner = [];                                                  //Array namens wgbewohner deklariert 
    
                wgbewohner.push('Mitbewohner 1: ' + result.user1);                    //dem Array werden die usernamen hinzugefügt, die im Datensatz des wgnamens in der Datenbank gefunden wurden 
                wgbewohner.push('Mitbewohner 2: ' + result.user2); 
                wgbewohner.push('Mitbewohner 3: ' + result.user3); 
                wgbewohner.push('Mitbewohner 4: ' + result.user4); 
    
                console.log(wgbewohner); 


                response.render('content', {'wgbewohner': wgbewohner});               //die content.ejs Seite soll ausgeführt werden, dazu wird dieser das Array wgbewohner mit den Usernamen übergeben 
            } else {
                errors.push('Das Passwort stimmt leider nicht überein.');
                response.render('errors', {'error': errors});
            }
        }
    });
});

//Logout nach Link mit löschen der Session 
app.get('/logout', (request, response) => {
    delete request.session.authenticated;
    delete request.session.wgname;
    response.redirect('/');
}); 

app.post('/responsibillities', (request,response) => {

    const wg_cleaner = request.body.wg_cleaner;
    const wg_shopper = request.body.wg_shopper;
    const wg_cooker = request.body.wg_cooker; 
    const wg_something = request.body.wg_something; 
    

    let errors = []; 

    if (wg_cleaner == "" || wg_cleaner == null) {              
        errors.push('Ihr habt noch niemanden der putzt');
    }     
    if (wg_shopper == "" || wg_shopper == null){
        errors.push('Ihr habt noch niemanden der einkauft');
    } 
    if (wg_cooker == "" || wg_cooker == null){
        errors.push('Ihr habt noch niemanden der kocht');
    } 
    if (wg_something == "" || wg_something == null){
        errors.push('Ihr habt noch niemanden der so alles andere erledigt');
    }

    if (errors.length == 0) { 
        response.render('new_content', {'wg_cleaner': wg_cleaner, 'wg_shopper': wg_shopper, 'wg_cooker': wg_cooker, 'wg_something': wg_something});
    }
    else {
        response.render('errors', {'error': errors}); 
    }  

});

