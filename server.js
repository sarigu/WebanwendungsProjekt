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
    secret: 'this-is-a-secret',                     //notwendig zum entschlüsseln
    resave: false,                                  //soll auf false gesetzt werden (?)
    saveUninitialized: false        
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

    const wgname = request.body.wgname;                    //die eingegebenen Werte von der register.html Seite werden hier in Konstanten gespeichert  
    const password = request.body.password;
    const repPassword = request.body.repPassword;
    const user1 = request.body.user1; 
    const user2 = request.body.user2;  
    const user3 = request.body.user3; 
    const user4 = request.body.user4; 
    let wg_cleaner = "";                                   //die Variablen werden schonmal deklariert ohne Werte und als let, damit man diese noch verändern kann 
    let wg_cooker = "";
    let wg_shopper = "";
    let wg_something = "";
    let wgbewohner = "";  
    let responsible_user = "";  


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
    } else 
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

                let newWG = {                                                        //alle Werte von der Registrierung werden mit entsprechender Bezeichnung in einer Konstanten gespeichert, die veränderbar ist
                    'wgname': wgname,
                    'password': encryptedPassword,
                    'wgbewohner': {'user1': user1,
                    'user2': user2,'user3': user3,
                    'user4': user4},
                    'responsible_user': {'wg_cleaner': wg_cleaner,
                    'wg_cooker': wg_cooker,
                    'wg_shopper': wg_shopper,
                    'wg_something': wg_something  }                                   //die wg_ .. Variablen haben noch keinen Wert zugewiesen bekommen (später dann aber)
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

    const wgname = request.body.wgname;                                                //die in dem HTML Dokument eingegebenen Werte werden hier in Variablen gespeichert
    let password = request.body.password;
    
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
    
                wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user1);                    //dem Array werden die usernamen hinzugefügt, die im Datensatz des wgnamens in der Datenbank gefunden wurden 
                wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user2); 
                wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user3); 
                wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user4); 


                let wgresponsibillities = [];

                wgresponsibillities.push(result.responsible_user.wg_cleaner);                         //dem Array für die Aufgabenverteilung werden die Namen der Bewohner hinzugefügt, die z.B. die Wg putzen 
                wgresponsibillities.push(result.responsible_user.wg_cooker);
                wgresponsibillities.push(result.responsible_user.wg_shopper);
                wgresponsibillities.push(result.responsible_user.wg_something);

                if (wgresponsibillities[0] != ""){                                        //Bedingung: in dem Datensatz, der mit dem wg Namen übreinstimmt, hat die Variable wg_cleaner einen Wert 
                    response.render('new_content', { 'wgresponsibillities':  wgresponsibillities});  //Anweisung: die Seite, wo die Aufgaben schon verteilt sind wird direkt angezeigt, dazu wird das Array mit den verteilten Aufgaben noch übergeben 
                } else {
                    response.render('content', {'wgbewohner': wgbewohner});         //Anweisung sonst: die Seite, wo man die Aufgaben aufteilen kann, wird angezeigt, dazu wird das Array mit den wg Bewohnernamen übergeben
                }

            } else {
                errors.push('Das Passwort stimmt leider nicht überein.');            //Anweisung sonst: Fehlermeldung wird dem Array hinzugefügt
                response.render('errors', {'error': errors});                        //die Fehlermedung wird wiedergegeben  
            }
        }
    });
});

//Logout nach Link mit löschen der Session 

app.get('/logout', (request, response) => {
    delete request.session.authenticated;
    delete request.session.wgname;                                                 //session wird gelöscht
    response.redirect('/');                                                        //wir kommen zurück auf die Login Seite
}); 

//Prüfen der Aufgabenverteilung 

app.post('/responsibillities', (request,response) => {            

    let wg_cleaner = request.body.wg_cleaner;                                   //Den Variablen werden die Werte von der content.ejs zugewiesen (hier: Name von der Person, die sauber macht)
    let wg_cooker = request.body.wg_cooker;
    let wg_shopper = request.body.wg_shopper; 
    let wg_something = request.body.wg_something; 
    const wgname = request.session.wgname;                                        //der Wg Name wird gespeichert, über den session namen  

    let wgresponsibillities = [];                                                 //Array wird deklariert

    wgresponsibillities.push(wg_cleaner, wg_shopper, wg_cooker, wg_something);    //dem Array werden die Variablen (mit den jeweiligen Namen, von dem, der die Aufgabe übernimmt) hinzugefügt

    let errors = []; 

    if (wg_cleaner == "" || wg_something == undefined ) {                                                       //Bedingung: niemand übernimmt die Aufgabe, kein Wert wurde der Variablen zugewiesen
        errors.push('Ihr habt noch niemanden der putzt');
    }     
    if (wg_shopper == "" || wg_something == undefined ){
        errors.push('Ihr habt noch niemanden der einkauft');
    } 
    if (wg_cooker == "" || wg_something == undefined ){
        errors.push('Ihr habt noch niemanden der kocht');
    } 
    if (wg_something == "" || wg_something == undefined ){
        errors.push('Ihr habt noch niemanden der so alles andere erledigt');
    }

    console.log(errors); 

    if (errors.length == 0) {                                                    //Bedingung: es gibt keine Fehlermeldungen im Fehlerarray
         
        db.collection(DB_COLLECTION).update({'wgname': wgname},{                 //Der Datensatz, der mit dem wg Namen übereinstimmt wird aktualisiert
            $set:{'responsible_user.wg_cleaner': wg_cleaner, 'responsible_user.wg_cooker': wg_cooker, 'responsible_user.wg_shopper': wg_shopper, 'responsible_user.wg_something': wg_something}  //die Daten hatten vorher keinen zugewiesenen Wert, deshalb bekommen sie nun einen
        });

        response.render('new_content', {'wgresponsibillities': wgresponsibillities});  //die Seite mit den bereits verteilten Aufgaben kann jetzt angezeigt werden und bekommt dafür das Array mit den verteilten Aufgaben übergeben 
          
    }
    else if (errors.length != 0) {
        response.render('errors', {'error': errors});                            //Anweisung sonst: Fehlermeldungen werden angezeigt
    }  

});

//Verteilte Aufgaben

app.get('/tasks', (request,response) => {

    const wgname = request.session.wgname;

    db.collection(DB_COLLECTION).findOne({'wgname': wgname}, (error, result) => {
        
        let wgresponsibillities = [];
        
        wgresponsibillities.push(result.responsible_user.wg_cleaner);                         //dem Array für die Aufgabenverteilung werden die Namen der Bewohner hinzugefügt, die z.B. die Wg putzen 
        wgresponsibillities.push(result.responsible_user.wg_cooker);
        wgresponsibillities.push(result.responsible_user.wg_shopper);
        wgresponsibillities.push(result.responsible_user.wg_something);

        response.render('new_content', {'wgresponsibillities': wgresponsibillities});
         
    });    

});

//neu verteilen

app.get('/content', (request,response) => {
 
    const wgname = request.session.wgname; 

    db.collection(DB_COLLECTION).findOne({'wgname': wgname}, (error, result) => { 

        let wgbewohner = [];                                                               //Array namens wgbewohner deklariert 
    
        console.log(wgbewohner); 

        wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user1);                    //dem Array werden die usernamen hinzugefügt, die im Datensatz des wgnamens in der Datenbank gefunden wurden 
        wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user2); 
        wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user3); 
        wgbewohner.push('Mitbewohner: ' + result.wgbewohner.user4);

        response.render('content', {'wgbewohner': wgbewohner}); 
    });
}); 

//Seite für restliche Aufgaben

app.get('/task_rest', (request,response) => {

    const wgname = request.session.wgname;

    response.render('rest',{'wgname': wgname});

});

//Einkaufsliste

app.get('/task_shopping', (request,response) => {

    const wgname = request.session.wgname;
    
    response.render('shopping_list',{'wgname': wgname});

});

//Kochplan für die Woche sich überlegen

app.get('/task_cooking', (request,response) => {

    let days = []; 

    days.push('Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag');   //die Wochentage werden in einem Array gespeichert
    
    response.render('cooking',{'days': days});    //das Array wir dem ejs Dokument cooking übergeben

}); 

//Kochplan für die Woche wiedergeben

app.post('/cooking_plan', (request,response) => {

    let dish = request.body.dish;           //die eingegeben Werte aus dem ejs Dokument werden hier gespiechert        
    let dishes = []; 

    dishes.push(dish);                     //die Varibalen in denen die eingegeben Werte aus dem ejs Dokument gespiechert wurden, werden in einem Array gespeichert 

    let errors = [];

    if (dishes < 7){                          //Bedingung: nicht für jeden Tag wurde ein Essen eingegeben
        errors.push('Der Essensplan ist noch nicht komplett');   //Fehlermeldung wird im Array gespeichert
        response.render('errors', {'error': errors});   //und direkt wiedergegeben
    }
    
    response.render('foodplan',{'dishes': dishes});         
});

//Aufgabenzuweisung was geputzt werden soll

app.get('/task_cleaning', (request,response) => {
    
    const wgname = request.session.wgname;
    
    response.render('cleaning_list',{'wgname': wgname});
    
}); 




