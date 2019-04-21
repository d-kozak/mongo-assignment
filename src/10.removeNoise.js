use reviews;

db.reviews.aggregate([
    {
        $addFields: {
            dates: {
                $dateFromString: {
                    dateString: "$dates", // convert to date object
                    onError: new Date() // use very old date on error
                }
            }
        }
    },
    {
        $match: {
            dates: {
                $gte: ISODate("2018-01-01")
            }
        }
    },
    {
        $out:"withoutNoise"
    }
]);
