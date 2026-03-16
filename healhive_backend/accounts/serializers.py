from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, TherapistProfile, PatientProfile


class AuthUserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(source='full_name', read_only=True)
    therapistVerified = serializers.SerializerMethodField()
    therapistProfileId = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    licenseNumber = serializers.SerializerMethodField()
    universityName = serializers.SerializerMethodField()
    assignedTherapist = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'age', 'mental_health_history', 'role', 'therapistVerified', 'therapistProfileId', 'specialization', 'bio', 'licenseNumber', 'universityName', 'assignedTherapist']

    def get_therapistVerified(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.is_verified if profile else None

    def get_therapistProfileId(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.id if profile else None

    def get_specialization(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.specialization if profile else ''

    def get_bio(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.bio if profile else ''

    def get_licenseNumber(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.license_number if profile else ''

    def get_universityName(self, obj):
        profile = getattr(obj, 'therapist_profile', None)
        return profile.university_name if profile else ''

    def get_assignedTherapist(self, obj):
        patient_profile = getattr(obj, 'patient_profile', None)
        if not patient_profile or not patient_profile.assigned_therapist:
            return None
        return patient_profile.assigned_therapist.id


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    age = serializers.IntegerField(required=False, min_value=10, max_value=120)
    mental_health_history = serializers.CharField(required=False, allow_blank=True)
    specialization = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    university_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[User.ROLE_USER, User.ROLE_THERAPIST, User.ROLE_ADMIN])

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        email = validated_data['email']
        name = validated_data['name']
        role = validated_data['role']
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            role=role,
            full_name=name,
            age=validated_data.get('age'),
            mental_health_history=validated_data.get('mental_health_history', ''),
        )

        if role == User.ROLE_THERAPIST:
            TherapistProfile.objects.create(
                user=user,
                specialization=validated_data.get('specialization', ''),
                license_number=validated_data.get('license_number', ''),
                university_name=validated_data.get('university_name', ''),
                bio=validated_data.get('bio', ''),
                is_verified=False,
            )
        elif role == User.ROLE_USER:
            PatientProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[User.ROLE_USER, User.ROLE_THERAPIST, User.ROLE_ADMIN])

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        role = attrs.get('role')

        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid credentials or wrong role selected.')
        if user.role != role:
            raise serializers.ValidationError('Invalid credentials or wrong role selected.')

        attrs['user'] = user
        return attrs


def generate_access_token(user: User) -> str:
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['name'] = user.full_name
    return str(refresh.access_token)
