export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_OaOEegHaY',
      userPoolClientId: '6vsfbafb4irkeqh104el0u9gga',
      region: 'eu-west-1',
      loginWith: {
        email: true,
      },
    },
  },
  Analytics: {
    Pinpoint: {
      // Project: pulari-analytics (eu-west-1)
      // Admins group: cognito → eu-west-1_OaOEegHaY → admins
      appId: (import.meta.env.VITE_PINPOINT_APP_ID as string | undefined) ?? '',
      region: 'eu-west-1',
    },
  },
};
