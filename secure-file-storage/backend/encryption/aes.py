import os
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

def generate_key() -> str:
    """Generate a random AES-256 key and return as base64 string."""
    key = get_random_bytes(32) # 256 bits
    return base64.b64encode(key).decode('utf-8')

def encrypt_file_data(file_data: bytes, key_b64: str) -> bytes:
    """Encrypt file data using AES-256-GCM."""
    key = base64.b64decode(key_b64)
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(file_data)
    # prepend nonce and tag to ciphertext for decryption
    return cipher.nonce + tag + ciphertext

def decrypt_file_data(encrypted_data: bytes, key_b64: str) -> bytes:
    """Decrypt file data using AES-256-GCM."""
    key = base64.b64decode(key_b64)
    # nonce is 16 bytes, tag is 16 bytes
    nonce = encrypted_data[:16]
    tag = encrypted_data[16:32]
    ciphertext = encrypted_data[32:]
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    decrypted_data = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted_data
