use reviews;
//     { "_id" : "apple", "count" : 12950 }
//     { "_id" : "google", "count" : 7819 }
//     { "_id" : "microsoft", "count" : 17930 }
//     { "_id" : "amazon", "count" : 26430 }
//     { "_id" : "facebook", "count" : 1590 }
//     { "_id" : "netflix", "count" : 810 }

db.undersampled.deleteMany({});

const min = 810;

for (let name of ["apple", "google", "microsoft", "amazon", "facebook", "netflix"]) {
    const samples = db.reviews.aggregate([
        {
            $match: {
                "company": name
            }
        }, {
            $sample: {
                size: min
            }
        },{
            $project:{
                "_id":0
            }
        }
    ]).toArray();
    db.undersampled.insertMany(samples);
}