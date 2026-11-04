using FluentValidation;

namespace AgileRetro.WebApi.Features.Session.CreateSession;

public sealed class SessionValidator : AbstractValidator<CreateSessionRequest>
{
    public SessionValidator()
    {
        RuleFor(request => request.Name).NotEmpty().MaximumLength(100);
        RuleFor(request => request.ParticipantName).NotEmpty().MaximumLength(100);
    }
}