
db.tfidf.deleteMany({});
db.wordStats.deleteMany({});
db.withStats.deleteMany({});

load("preparations.js");
const map = function () {
    const calcTf = (word, document) => {
        const count = document.filter(elem => word === elem).length;
        return count / document.length;
    };
    const stats = this.stats[0];
    const tf = calcTf("work", `${this.summary}`.split(' '));
    const idf = Math.log10(stats.totalDocs / stats.work);
    const tfidf = tf * idf;
    emit(this.id, {
        summary: this.summary,
        tfidf
    })
};

db.withStats.mapReduce(
    map,
    function (key, values) {
        throw new Error(`Should never be called, was called with key ${key} and values ${values}`)
    },
    {
        out: "tfidf"
    }
);