using FluentValidation;

namespace AgileRetro.WebApi.Features.Participant.JoinSession;

public sealed class SessionValidator : AbstractValidator<JoinSessionRequest>
{
    public SessionValidator()
    {

        RuleFor(request => request.ParticipantName).NotEmpty().MaximumLength(100);
    }
}