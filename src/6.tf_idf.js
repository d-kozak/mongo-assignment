db.reviews.aggregate(
    [
        {$match: {summary: {$type: 2}}},
        {$project: {summary: {$split: ["$summary", " "]}, _id: 0}},
        {$out: "documents"}
    ]
);

db.reviews.aggregate(
    [
        {$lookup: {from: "documents", localField: "null", foreignField: "null", as: "documents"}},
        {$project: {"documents._id": 0}},
        {$out: "joined"}
    ]
)

// const map = function () {
//     const tf = (word, document) => {
//         const count = document.filter(elem => word === elem).length;
//         return count / document.length;
//     };
//
//     const idf = (word, documents) => {
//         const count = documents.filter(document => document.summary.indexOf(word) > 0).length;
//         return Math.log(documents.length / count);
//     };
//
//
//     const word = "work";
//     const summary = `${this.summary}`.split(' ');
//     const objToEmit = {
//         "tf-idf": tf(word, summary) * idf(word, documents),
//         summary
//     }
//     emit(this.id, objToEmit);
// };
//
// const reduce = function (key, values) {
//     throw new Error("should never be called");
// };
//
//
// db.joined.mapReduce(
//     map,
//     reduce,
//     "tmp"
// );
