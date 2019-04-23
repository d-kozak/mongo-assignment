
db.reviews.aggregate([
    {
        $addFields:{
            "overall-ratings":{
                $divide:["$overall-ratings",5]
            }
        }
    },
    {
        $out:"normalized"
    }
]);