module.exports = {
    FB_PAGE_TOKEN: EAAEiITTQ8bUBAH141HmZA37ekZCBaKeu0EkGfSOlQ5Q93c2WiqDsegAJky9Sm5N9BLwFK7UfrP3aAjF4FihF3wWP4oR0QZAQXm9xE9elbnsyr2hcuGlgmBWs9gLlkN7MBZBsDfwpinTxX0uQhNjv2c2w50KDdaF7hHjXnaLZBS3zT6rzBzh83k1nvtJHDhN0ZD,
    FB_VERIFY_TOKEN: MGB_FAQbot ,
    FB_APP_SECRET: fc980ade8a5f00a53bf196cdc2329237,
    SERVER_URL: "https://mgb-faqbot.herokuapp.com/",
    GOOGLE_PROJECT_ID: mgb-faqbot,
    DF_LANGUAGE_CODE: fr,
    GOOGLE_CLIENT_EMAIL: dialogflow-bmntck@mgb-faqbot.iam.gserviceaccount.com,
    GOOGLE_PRIVATE_KEY: -----BEGIN PRIVATE KEY-----
    MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6cvkTQJrB9Cqc
    1gam9imfJMYBnp7c0x4w3cz6TYluah7f+yarvXOHYQfSXGW5l0VkNmX+xeTSKot7
    q7Seb9h7tC6O0iIRizQdeKyANz1psczQPUA0huzHRbFiFZ4WVMfh2r/hUn/WBL/G
    2S6amIsjYT2zNP+aHLysDBHjOAfex8bkUINuHIUj2CcFZ8c5UAvtD+MWwU90DYiX
    EzvH9dVUh0lqDGeg2Vu5wd9lq8lym/BYnZzocmbafYT1bRw9xE8H1c8uRhofE3qm
    FDzd/hkoWuh7ifj+xD/i+wQrMU7pOzQMJ1r45cXbnGhTvoGuZS4oCNqKdFpP2hGn
    kVQFQa9TAgMBAAECggEABySLQWfgmj+pPbXnrlXcUm2u0A2Go9viGm/Iehix4UdP
    8CAWIze5Blq68Kl2JdPHshWfmgsAURSsztR7vMXtUW1X6Czgw7LWvzobfas9LdTQ
    PAAKhq/l13PyGGUUnaeTXaYT103WS836Iqm43O3zBv3Ro8t/TDC56o5R0Uq75y3f
    FuU9vo/CdtInsNvCsaDqFWcR1Xzqyb8qI+0vNZWOdJz/NMS/dYMz1v/nYb0XsVBq
    8OO6CFTBxZs+n5/spr7KCJWg5ORKZBhUGdo2EkC01/n+UKsoOweJdsxnRvcKOITN
    q0G0MqSvCLwDCZtzPZJjGZad7Nu0NAcsTNoyh+7jHQKBgQDdc8rGDjDEbluYnyaP
    qKt5i2xgysNaZg8eEzSQi2g319ZqQlyOcXwBLgFj1orqpabTssvP/rYRK3Z7NbKe
    weRvLzZaFEHzJpdj8EWmTTzEIb3l1IyvvIm0bBQZkXPEml647D7EsSWqD0rUu3Js
    LCwuCsR3xmJAz2kYsI873y2DxwKBgQDXiT9cXwC47HJziPuzKWb2tbTiOIrOhfNN
    4ISDkXUucJu8tdphohJsynLyPFYCkAI09BQfTbgiZ6ooVnDW0d1DsQCi4a0OHL47
    +523ynwsBHvqlzq+bdxVxOsSGOr3CHrwBBgx8vS7XeL37yh9piutNLchobuNriqX
    yk+bv4sgFQKBgQDPyZdJEQWXOol9gk+XWkdTK4xModR9XOfwa0rWGch3JXGNkKjy
    Cu+016r8N9Fu7HHFj62Hg1Lod2SbpT3tkra50I3qJbnf4aUJY+imazCKQ7LAFRjQ
    yFJZVVPizcTXg5U/ZIRc4G8by2+Gfj+V2ji2FupUDHQipbrSLNCo9/bn/wKBgF+Z
    6/W/2eUsU5O1hdcxHQ9/B210IPV76rB3Tq/A/BYOMrXgf63gooWIwrV5V7kpQSFV
    xfsgkPUJwCrGNKTET31v7FVS/lyNGUAn2gwkjzFDB+fFDnRa7GlKv+22CbprE4SU
    fFrjZfQZr8vDU9VvuF3KTRRo1XUBdLkBLpBpxH8FAoGBAIkRmGHUlG21vuTEKgD0
    LflYAtzIXGie4IoeM+g/PhlJyzU+v+Uf6QQoEE4CYvwK75RhlPZi/ubNJ0lETcHr
    58LnPs21/peVFRunREBpvMYGPzB7s9ww37Tkg03sxifJXxtoC7YSQLWYZwi8hJf9
    1SI5d9Bnq4b89jZwB9L1l7AE
    -----END PRIVATE KEY-----
    ",
    
    PG_CONFIG: {  
        user: process.env.PG_CONFIG_USER,  
        database: process.env.PG_CONFIG_DATABASE,  
        password: process.env.PG_CONFIG_PASSWORD,  
        host: process.env.PG_CONFIG_HOST,  
        port: 5432,  
        max: 10,  
        idleTimeoutMillis: 30000,  
    },
    
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY, 
    EMAIL_FROM: process.env.EMAIL_FROM,  
    EMAIL_TO: process.env.EMAIL_TO 
};
