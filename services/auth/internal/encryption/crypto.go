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
	salt       = "spendflix-auth-salt"
	iterations = 100000
)

func Encrypt(plaintext, secret string) (string, error) {
	// Generate IV
	iv := make([]byte, ivLength)
	if _, err := rand.Read(iv); err != nil {
		return "", err
	}

	// Generate key using PBKDF2
	key := pbkdf2.Key([]byte(secret), []byte(salt), iterations, keyLength, sha256.New)

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

	// Combine IV + tag + encrypted
	result := append(iv, tag...)
	result = append(result, encrypted...)

	return base64.StdEncoding.EncodeToString(result), nil
}

func Decrypt(encryptedText, secret string) (string, error) {
	// Decode base64
	data, err := base64.StdEncoding.DecodeString(encryptedText)
	if err != nil {
		return "", err
	}

	if len(data) < ivLength+tagLength {
		return "", errors.New("invalid encrypted data length")
	}

	// Extract components
	iv := data[0:ivLength]
	tag := data[ivLength : ivLength+tagLength]
	encrypted := data[ivLength+tagLength:]

	// Generate key
	key := pbkdf2.Key([]byte(secret), []byte(salt), iterations, keyLength, sha256.New)

	// Create cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Combine encrypted + tag to decrypt
	ciphertext := append(encrypted, tag...)

	// Decrypt
	plaintext, err := aesgcm.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
