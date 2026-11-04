using System.Security.Cryptography;
namespace AgileRetro.WebApi.Features.Session.CreateSession;

public static class JoinCodeGenerator
{
    private const string Characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string Generate(int length = 8)
    {
        return string.Create(length, Characters, (chars, alphabet) =>
        {
            for (var i = 0; i < chars.Length; i++)
            {
                chars[i] = alphabet[
                    RandomNumberGenerator.GetInt32(alphabet.Length)];
            }
        });
    }
}