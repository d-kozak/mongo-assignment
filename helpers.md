# Helpers
Queries or techniques I found somewhat useful when working on the assignment


Find distinct values of companies

```js
db.reviews.distinct("company")
```
Save them into separate collection, each item document gets id automatically
```js
db.reviews.distinct("company").forEach(elem => db.companies.insert({name:elem}))
```

map using aggregation (project operator)
```js
db.reviews.aggregate([{$project : { company: { $substr : ["$company",0,2]  }  }}])

```


Get dates of 10 randomly selected reviews
```js
db.reviews.aggregate([{$project:{dates:1}},{$sample:{size:10}}])
```



Merge two collections based on a field, this includes the second based on the first one
```js
db.reviews.aggregate([{$lookup:{from:"companies",localField:"company",foreignField:"name",as:"others"}}])
```