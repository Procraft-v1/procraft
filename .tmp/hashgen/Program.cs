using Microsoft.AspNetCore.Identity;

var hasher = new PasswordHasher<object>();
var marker = new object();

if (args.Length == 2 && args[0] == "verify")
{
    // args[1] = "<base64hash>|<password>" — verifies a Node-produced hash.
    var parts = args[1].Split('|', 2);
    var result = hasher.VerifyHashedPassword(marker, parts[0], parts[1]);
    Console.WriteLine(result);
    return;
}

Console.WriteLine("1234|" + hasher.HashPassword(marker, "1234"));
Console.WriteLine("S3cure!Password|" + hasher.HashPassword(marker, "S3cure!Password"));
Console.WriteLine("parol-2026 unicode-ô|" + hasher.HashPassword(marker, "parol-2026 unicode-ô"));
