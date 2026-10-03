// ---------------------------------------------------------------------------
// Settings for the training page. Everything you may want to change is here.
// ---------------------------------------------------------------------------

window.TRAINING_CONFIG = {
  title: "Annual In-Home Care Training",

  // TODO: replace with Shana's Right at Home email address.
  notifyEmail: "shana.yu@gmail.com",

  // Google Drive file ID of the training video. The file must be shared as
  // "Anyone with the link can view", otherwise the embedded player stays blank.
  driveVideoId: "1gsvwQfJpxmCEwC33AqXlxKpRmBbFBbn0",

  // Correct answers needed to pass (out of the number of questions below).
  passMark: 8,

  // Send the completion notice automatically through FormSubmit.co (free, no
  // account). The very first submission sends Shana an activation email; until
  // she clicks it, notices are not delivered. The pre-written email shown on
  // the certificate page works either way.
  autoSend: true,

  // TODO: replace these with questions based on the training video.
  // `answer` is the index of the correct option, counting from 0.
  questions: [
    {
      q: "What is the single most effective way to prevent the spread of infection in a client's home?",
      options: [
        "Wearing gloves for every task",
        "Washing your hands properly and often",
        "Opening the windows every day",
        "Keeping the client in one room"
      ],
      answer: 1
    },
    {
      q: "How long should you scrub your hands with soap when washing them?",
      options: ["5 seconds", "At least 20 seconds", "Exactly 2 minutes", "Until the soap is gone"],
      answer: 1
    },
    {
      q: "You notice unexplained bruises on your client and they seem afraid of a family member. What should you do?",
      options: [
        "Ask the family member about it directly",
        "Wait to see if it happens again",
        "Report it to your supervisor right away, following your agency's abuse-reporting procedure",
        "Do nothing; it is a private family matter"
      ],
      answer: 2
    },
    {
      q: "Which of these is the best way to reduce a client's risk of falling at home?",
      options: [
        "Keep walkways clear, use good lighting and remove loose rugs",
        "Encourage the client to stay in bed",
        "Polish the floors so they are easy to clean",
        "Move furniture often so the client stays alert"
      ],
      answer: 0
    },
    {
      q: "Your client falls and you are alone with them. What is the right first step?",
      options: [
        "Lift them up immediately",
        "Leave them and call their family",
        "Stay calm, check them for injury before moving them, and call for help if needed",
        "Give them pain medication from the cabinet"
      ],
      answer: 2
    },
    {
      q: "When lifting or helping to move a client, good body mechanics means:",
      options: [
        "Bending at the waist and lifting with your back",
        "Bending your knees, keeping your back straight and holding the load close to your body",
        "Twisting your body to save time",
        "Lifting quickly so the client is not uncomfortable"
      ],
      answer: 1
    },
    {
      q: "A client's medical information should be shared with:",
      options: [
        "Neighbours who ask how the client is doing",
        "Your friends, as long as you do not use the client's name",
        "Only people involved in the client's care who are authorised to know",
        "Anyone, posted on social media without a photo"
      ],
      answer: 2
    },
    {
      q: "A client living with dementia becomes agitated and keeps asking for their late spouse. What is the best approach?",
      options: [
        "Correct them firmly so they accept reality",
        "Stay calm, speak gently, acknowledge their feelings and redirect to a soothing activity",
        "Leave the room until they calm down",
        "Raise your voice so they can hear you clearly"
      ],
      answer: 1
    },
    {
      q: "Which of these is a right every client has?",
      options: [
        "To be treated with dignity and to make choices about their own care",
        "To have the caregiver do any household task they ask for",
        "To receive free medication from the caregiver",
        "To choose the caregiver's working hours"
      ],
      answer: 0
    },
    {
      q: "You notice your client is suddenly confused, has a drooping face and slurred speech. What should you do?",
      options: [
        "Let them rest and check again in an hour",
        "Call emergency services (911) immediately — these are signs of a stroke",
        "Give them something to eat",
        "Write it down and mention it at the end of your shift"
      ],
      answer: 1
    }
  ]
};
