use reviews;
//     { "_id" : "apple", "count" : 12950 }
//     { "_id" : "google", "count" : 7819 }
//     { "_id" : "microsoft", "count" : 17930 }
//     { "_id" : "amazon", "count" : 26430 }
//     { "_id" : "facebook", "count" : 1590 }
//     { "_id" : "netflix", "count" : 810 }


const min = "810";

db.undersampled.deleteMany({});

for (let name of ["apple", "google", "microsoft", "amazon", "facebook", "netflix"]) {

}