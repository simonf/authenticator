# Caution
Owing to a CORS bug in Firefox, this service only works in Chrome.

# Database

A MongoDB called "auth" holds the list of permitted users. User objects are structured as:
```js
{
  username: auser,
  password: <plaintext>,
  organisation: companyidentifier,
  token: <JWT signed token>,
  expiry: <local unix epoch>
}
```
At this time, no UI exists for adding users. Instead, use the mongo command shell to insert a new user. For example:  
`
db.users.save( { username: "myname", password: "impossibletoguess", organisation: "123454897" });
`  

Note that the token and expiration date will be added after successful authentication.

The `organisation` attribute must match whatever the subnscribing application expects to see when using if to authorise access to data. For example, if an inventory system holds port information by OCN, then this field should hold the OCN.

# Services
The authorisation services offered are fairly basic. All offer CORS and can therefore be called from anywhere.

## login
POST username and password to `/login` as JSON of the form:  
`
{ "username": "user", "password": "pass" }
`
The response will contain a JSON object like this:
```json
{
  "data": {
        "username": "simon",
        "organisation": "123456",
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfX3YiOjAsInBhc3N3b3JkIjoic2wefdsoiuCJlbWFpbCI6",
        "expires": "2015-07-16T09:06:04.403Z"
    }
}

```
## logout
GET `/logout` with the token in an `Authorization` HTTP header:

```HTTP
Content-Type: application/json  
Authorization: Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfX3YiOjAsInBhc3N3b3JkIjoic2ltb24iLCJlbWFpbCI6
```
The service will delete the current authorisation token and return a `200` status code.

## authorise
GET '/authorise' with the token in an `Authorization` HTTP header:

```HTTP
Content-Type: application/json  
Authorization: Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfX3YiOjAsInBhc3N3b3JkIjoic2ltb24iLCJlbWFpbCI6
```

The service will respond with a JSON object like this:
```json
{
  "data": {
        "username": "simon",
        "organisation": "123456",
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfX3YiOjAsInBhc3N3b3JkIjoic2wefdsoiuCJlbWFpbCI6",
        "expires": "2015-07-16T09:26:13.157Z"
    }
}

```

Note that the token contained in this response will be the same token as issued by the `/login` service, but the expiration date will be different. Authorisation attempts after the expiration date will return a 403 error. Client applications should direct the user to re-authenticate.
