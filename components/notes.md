NOTES

GRANT CONNECT ON DATABASE mydb TO postgres ;

the mostRecent query

    select: {
      id: true,
      src: true,
      values: true,
    },

baseCanvas.toBlob(async (blob)

json.src = URL.createObjectURL(blob);
              setCollage(json);

const valueJson = JSON.stringify(newValues);

    const newValues = JSON.parse(mostRecentCollage.values).map(
      (v: number) => v - 200
    );

?????????

I captured network traffic from the original, and saved it locally.


## s3 buckets etc

- <https://next-s3-upload.codingvalue.com/setup>

s3://collagesmjp/collage-1643085786.png

https://collagesmjp.s3.amazonaws.com/collage-1643085786.png



Access to image at 'https://collagesmjp.s3.amazonaws.com/collage-1643085786.png' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

AWS S3 Access to image ' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

Image can now be retrieved in browser - granted public-read access


### bucket policy
This was NOT part of the next-s3-upload demo setup

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowPublicRead",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::collagesmjp/*"
        }
    ]
}
```

### CORS setup

I needed to add `"GET"` to the `AllowedMethod` list, below
Otherwise, as shows in the next-s3-upload setup example

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ]
    }
]
```