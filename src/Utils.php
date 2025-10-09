<?php

namespace DotOrg\GCE;

class Utils {

	public static function generateFingerprint( $length = 10 ) : string {
		$characters       = 'abcdefghijklmnopqrstuvwxyz';
		$charactersLength = strlen( $characters );
		$randomString     = '';
		for ( $i = 0; $i < $length; $i++ ) {
			$randomString .= $characters[ random_int( 0, $charactersLength - 1 ) ];
		}
		return $randomString;
	}

	/**
	 * Return timestamp in milliseconds
	 * @return int
	 */
	public static function getTimestamp() : int {
		$date = new \DateTimeImmutable();
		return (int) $date->format('Uv');
	}

}
