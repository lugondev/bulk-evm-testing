import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto'
import { promisify } from 'util'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-min-32-chars-long!!!!!'
const ALGORITHM = 'aes-256-gcm'

export async function encryptPrivateKey(privateKey: string) {
	const iv = randomBytes(16)
	const salt = randomBytes(16)
	const key = await promisify(scrypt)(ENCRYPTION_KEY, salt, 32) as Buffer

	const cipher = createCipheriv(ALGORITHM, key, iv)
	const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()])
	const authTag = cipher.getAuthTag()

	return {
		encrypted: encrypted.toString('hex'),
		iv: iv.toString('hex'),
		authTag: authTag.toString('hex'),
		salt: salt.toString('hex')
	}
}

export async function decryptPrivateKey(encryptedData: {
	encrypted: string
	iv: string
	authTag: string
	salt: string
}) {
	const key = await promisify(scrypt)(
		ENCRYPTION_KEY,
		Buffer.from(encryptedData.salt, 'hex'),
		32
	) as Buffer

	const decipher = createDecipheriv(
		ALGORITHM,
		key,
		Buffer.from(encryptedData.iv, 'hex')
	)

	decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
		decipher.final()
	])

	return decrypted.toString('utf8')
}
