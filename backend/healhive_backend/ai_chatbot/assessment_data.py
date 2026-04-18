TEST_DEFINITIONS = {
    'PHQ9': {
        'name': 'PHQ-9 Depression Assessment',
        'description': 'Screens for depressive symptoms over the last two weeks.',
        'questions': [
            'Little interest or pleasure in doing things?',
            'Feeling down, depressed, or hopeless?',
            'Trouble falling or staying asleep, or sleeping too much?',
            'Feeling tired or having little energy?',
            'Poor appetite or overeating?',
            'Feeling bad about yourself — or that you are a failure?',
            'Trouble concentrating on things?',
            'Moving or speaking slowly, or being fidgety/restless?',
            'Thoughts that you would be better off dead or of hurting yourself?'
        ],
        'options': [
            {'score': 0, 'label': 'Not at all'},
            {'score': 1, 'label': 'Several days'},
            {'score': 2, 'label': 'More than half the days'},
            {'score': 3, 'label': 'Nearly every day'},
        ],
    },
    'GAD7': {
        'name': 'GAD-7 Anxiety Assessment',
        'description': 'Screens for generalized anxiety symptoms.',
        'questions': [
            'Feeling nervous, anxious, or on edge?',
            'Not being able to stop or control worrying?',
            'Worrying too much about different things?',
            'Trouble relaxing?',
            'Being so restless that it is hard to sit still?',
            'Becoming easily annoyed or irritable?',
            'Feeling afraid as if something awful might happen?'
        ],
        'options': [
            {'score': 0, 'label': 'Not at all'},
            {'score': 1, 'label': 'Several days'},
            {'score': 2, 'label': 'More than half the days'},
            {'score': 3, 'label': 'Nearly every day'},
        ],
    },
    'PSS': {
        'name': 'Perceived Stress Scale',
        'description': 'Measures perception of stress over the last month.',
        'questions': [
            'How often have you been upset because of something unexpected?',
            'How often have you felt unable to control important things in your life?',
            'How often have you felt nervous and stressed?',
            'How often have you felt confident about your ability to handle personal problems?',
            'How often have you felt that things were going your way?',
            'How often have you found that you could not cope with all the things you had to do?',
            'How often have you been able to control irritations in your life?',
            'How often have you felt on top of things?',
            'How often have you been angered by things outside your control?',
            'How often have you felt difficulties were piling up too high to overcome?'
        ],
        'options': [
            {'score': 0, 'label': 'Never'},
            {'score': 1, 'label': 'Almost never'},
            {'score': 2, 'label': 'Sometimes'},
            {'score': 3, 'label': 'Fairly often'},
            {'score': 4, 'label': 'Very often'},
        ],
    },
    'UCLA': {
        'name': 'UCLA Loneliness Scale',
        'description': 'Assesses social isolation and loneliness patterns.',
        'questions': [
            'How often do you feel that you lack companionship?',
            'How often do you feel left out?',
            'How often do you feel isolated from others?',
            'How often do you feel in tune with people around you?',
            'How often do you feel alone?',
            'How often do you feel part of a group of friends?',
            'How often do you feel that no one really knows you well?',
            'How often do you feel people are around you but not with you?'
        ],
        'options': [
            {'score': 0, 'label': 'Never'},
            {'score': 1, 'label': 'Rarely'},
            {'score': 2, 'label': 'Sometimes'},
            {'score': 3, 'label': 'Often'},
        ],
    },
}
