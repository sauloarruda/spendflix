package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"

	"golang.org/x/crypto/pbkdf2"
)

const (
	algorithm  = "aes-256-gcm"
	ivLength   = 12
	tagLength  = 16
	keyLength  = 32
	iterations = 100000
	saltLength = 16
)

func Encrypt(plaintext, secret string) (string, error) {
	// Generate IV
	iv := make([]byte, ivLength)
	if _, err := rand.Read(iv); err != nil {
		return "", err
	}

	// Generate random salt per encryption
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Generate key using PBKDF2
	key := deriveKey(secret, salt)

	// Create cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Encrypt
	ciphertext := aesgcm.Seal(nil, iv, []byte(plaintext), nil)

	// Separate tag from ciphertext
	tag := ciphertext[len(ciphertext)-tagLength:]
	encrypted := ciphertext[:len(ciphertext)-tagLength]

	// Combine salt + IV + tag + encrypted
	result := make([]byte, 0, len(salt)+len(iv)+len(tag)+len(encrypted))
	result = append(result, salt...)
	result = append(result, iv...)
	result = append(result, tag...)
	result = append(result, encrypted...)

	return base64.StdEncoding.EncodeToString(result), nil
}

func Decrypt(encryptedText, secret string) (string, error) {
	// Decode base64
	data, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	if len(data) < saltLength+ivLength+tagLength {
		return "", errors.New("invalid encrypted data length")
	}

	salt := data[:saltLength]
	payload := data[saltLength:]

	return decryptWithSalt(secret, salt, payload)
}

func deriveKey(secret string, salt []byte) []byte {
	return pbkdf2.Key([]byte(secret), salt, iterations, keyLength, sha256.New)
}

func decryptWithSalt(secret string, salt []byte, payload []byte) (string, error) {
	if len(payload) < ivLength+tagLength {
		return "", errors.New("invalid encrypted data length")
	}

	iv := payload[0:ivLength]
	tag := payload[ivLength : ivLength+tagLength]
	encrypted := payload[ivLength+tagLength:]

	key := deriveKey(secret, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	ciphertext := make([]byte, len(encrypted)+len(tag))
	copy(ciphertext, encrypted)
	copy(ciphertext[len(encrypted):], tag)
	plaintext, err := aesgcm.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
