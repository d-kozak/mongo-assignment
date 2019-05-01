db.index.deleteMany({});

db.reviews.mapReduce(
    function () {
        for (let word of `${this.summary}`.split(/\s+/)) {
            emit(word, {
                documents: [this.id]
            });
        }
    },
    function (key, values) {
        const documents = [];
        for(let value of values){
            documents.push(...value.documents)
        }
        return {
            documents
        }
    },
    "index"
)